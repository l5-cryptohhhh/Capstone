import { useEffect, useRef } from 'react'
import {
  Box3,
  DirectionalLight,
  Group,
  Mesh,
  NeutralToneMapping,
  OrthographicCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Timer,
  Vector3,
  WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const MODEL_URL = '/models/ball.glb'

const HOP_SECONDS = 0.78 // durata di un rimbalzo, da un tocco al successivo
const HOP_HEIGHT = 1.35 // altezza del rimbalzo, in diametri del pallone
const LEFT = 0.37 // dove tocca sulla "A" e sulla "I", come frazione della larghezza
const RIGHT = 0.7
const SQUASH = 0.14 // schiacciamento al contatto con la scritta

// Lancio verso la dashboard: spirale verso il centro mentre il pallone cresce fino a coprire lo schermo
const LAUNCH_SECONDS = 1.7
const LAUNCH_TURNS = 1.75 // giri della spirale
const FADE_FROM = 0.8 // frazione del lancio da cui il pallone si dissolve nel colore del fondo
const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2)

type Props = {
  /** Quando diventa true il pallone parte in spirale e riempie lo schermo. */
  launch?: boolean
  /** Il modello è caricato e visibile: da qui il lancio è possibile. */
  onReady?: () => void
  /** Il lancio è finito: lo schermo è del colore del fondo, si può cambiare pagina. */
  onLaunched?: () => void
}

/**
 * Il pallone che rimbalza sulla scritta "AI" della pagina di accesso: modello 3D (solo il pallone),
 * sfondo trasparente, nessun controllo. Riempie il contenitore posizionato sopra la scritta; il suo bordo
 * inferiore è la linea su cui rimbalza. Si ferma con "riduci animazioni" e a scheda nascosta.
 * Con `launch` il contenitore diventa a tutto schermo e il pallone lascia la scritta per la transizione di accesso.
 */
export default function BouncingBall({ launch = false, onReady, onLaunched }: Props) {
  const host = useRef<HTMLSpanElement>(null)
  const launchRequested = useRef(launch)
  const readyCb = useRef(onReady)
  const launchedCb = useRef(onLaunched)

  useEffect(() => {
    launchRequested.current = launch
    readyCb.current = onReady
    launchedCb.current = onLaunched
  }, [launch, onReady, onLaunched])

  useEffect(() => {
    const el = host.current
    if (!el) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      return // senza WebGL la scritta resta com'è
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = NeutralToneMapping
    el.appendChild(renderer.domElement)

    const scene = new Scene()
    const pmrem = new PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.8
    const key = new DirectionalLight(0xffffff, 1.4)
    key.position.set(-2, 4, 5)
    scene.add(key)

    // Camera ortografica in pixel: 1 unità = 1 px, l'origine è l'angolo in basso a sinistra del contenitore.
    // Profondità ampia: durante il lancio il raggio del pallone supera il migliaio di pixel.
    const camera = new OrthographicCamera(0, 1, 1, 0, -6000, 6000)
    const pivot = new Group() // posizione e schiacciamento
    const spin = new Group() // rotazione del pallone
    pivot.add(spin)
    scene.add(pivot)

    let width = 1
    let radius = 1
    let loaded = false
    let disposed = false
    let launching = false
    let lastX = 0
    let lastY = 0

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el
      if (w === 0 || h === 0) return
      width = w
      renderer.setSize(w, h)
      camera.right = w
      camera.top = h
      camera.updateProjectionMatrix()
      if (!launching) radius = Math.min(w * 0.2, h * 0.2)
      if (loaded && (reduced || launching)) renderer.render(scene, camera)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(el)

    // s: fase del rimbalzo (0 = tocco, 1 = tocco successivo); k: indice del rimbalzo
    const place = (time: number) => {
      const t = reduced ? 0 : time / HOP_SECONDS
      const k = Math.floor(t)
      const s = t - k
      const from = k % 2 === 0 ? LEFT : RIGHT
      const to = k % 2 === 0 ? RIGHT : LEFT
      const x = (from + (to - from) * s) * width
      const lift = 4 * s * (1 - s) // parabola: 0 al tocco, 1 al culmine
      const contact = Math.max(0, 1 - Math.min(s, 1 - s) / 0.1) // 1 al tocco, 0 poco dopo
      const squash = reduced ? 0 : SQUASH * contact * contact
      const y = radius * (1 - squash) + lift * HOP_HEIGHT * radius * 2
      lastX = x
      lastY = y
      pivot.position.set(x, y, 0)
      pivot.scale.set(radius * (1 + squash * 0.7), radius * (1 - squash), radius)
      spin.rotation.z = -t * 2.4
      spin.rotation.x = t * 1.1
    }

    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return
        const model = gltf.scene
        // pallone al centro e di raggio 1: il modello originale ha una posizione e una scala proprie
        const box = new Box3().setFromObject(model)
        const center = box.getCenter(new Vector3())
        const size = box.getSize(new Vector3())
        model.position.sub(center)
        const fit = new Group()
        fit.add(model)
        fit.scale.setScalar(2 / Math.max(size.x, size.y, size.z))
        spin.add(fit)
        loaded = true
        resize()
        place(0)
        renderer.render(scene, camera)
        readyCb.current?.()
      },
      undefined,
      () => {
        /* se il modello non si carica resta solo la scritta */
      },
    )

    // --- lancio: il contenitore passa a tutto schermo e il pallone riparte dal punto in cui si trova ---
    let launchElapsed = 0
    let launchedReported = false
    let startR = 1
    let startAngle = 0
    let startDist = 0
    const startLaunch = () => {
      const rect = el.getBoundingClientRect()
      const x0 = rect.left + lastX
      const y0 = window.innerHeight - rect.bottom + lastY // l'origine della camera è in basso a sinistra
      startR = radius
      launching = true
      el.classList.add('ball--full')
      resize() // il contenitore è ora grande quanto la finestra
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      startAngle = Math.atan2(y0 - cy, x0 - cx)
      startDist = Math.hypot(x0 - cx, y0 - cy)
    }

    const placeLaunch = (u: number) => {
      const w = window.innerWidth
      const h = window.innerHeight
      const e = ease(u)
      const angle = startAngle + LAUNCH_TURNS * Math.PI * 2 * e
      const dist = startDist * (1 - e)
      const finalR = Math.hypot(w, h) * 0.8
      const r = startR * Math.pow(finalR / startR, e * e)
      pivot.position.set(w / 2 + Math.cos(angle) * dist, h / 2 + Math.sin(angle) * dist, 0)
      pivot.scale.setScalar(r)
      spin.rotation.z = -launchElapsed * 7
      spin.rotation.x = launchElapsed * 3.2
      // nel finale il pallone si dissolve nel colore del fondo: la dashboard compare da un fondo uniforme
      const fade = Math.min(1, Math.max(0, (u - FADE_FROM) / (1 - FADE_FROM)))
      renderer.domElement.style.opacity = String(1 - fade)
      el.style.background = `color-mix(in srgb, var(--paper) ${Math.round(fade * 100)}%, transparent)`
    }

    const timer = new Timer()
    let frame = 0
    let elapsed = 0
    const loop = () => {
      frame = requestAnimationFrame(loop)
      if (document.hidden) return
      timer.update()
      const dt = Math.min(timer.getDelta(), 0.1) // dopo una pausa la scena non "salta"
      if (!loaded) return

      if (launching) {
        launchElapsed += dt
        const u = Math.min(1, launchElapsed / LAUNCH_SECONDS)
        placeLaunch(u)
        renderer.render(scene, camera)
        if (u >= 1 && !launchedReported) {
          launchedReported = true
          launchedCb.current?.()
        }
        return
      }

      if (launchRequested.current && !reduced) {
        startLaunch()
        return
      }
      elapsed += dt
      if (!reduced) {
        place(elapsed)
        renderer.render(scene, camera)
      }
    }
    resize()
    loop()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      scene.traverse((o) => {
        const mesh = o as Mesh
        if (!mesh.isMesh) return
        mesh.geometry.dispose()
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((m) => m.dispose())
      })
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <span ref={host} className="ball" aria-hidden="true" />
}
