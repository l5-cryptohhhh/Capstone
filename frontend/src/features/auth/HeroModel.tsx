import { useEffect, useRef, useState } from 'react'
import {
  AnimationMixer,
  DirectionalLight,
  Group,
  LoopOnce,
  Mesh,
  NeutralToneMapping,
  Object3D,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Timer,
  WebGLRenderer,
} from 'three'
import type { AnimationAction, AnimationClip } from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const MODEL_URL = '/models/boy-juggling.glb'

// Tempi del modello (30 fps): il palleggio tocca col destro al fotogramma 0 e col sinistro al 20.
const LEFT_CONTACT = 20 / 30
const KICK_DONE_AFTER = 1.1 // secondi dall'inizio del tiro: il pallone è già uscito di scena

type Props = {
  /** Quando diventa true il ragazzo tira il pallone fuori scena (al prossimo tocco del palleggio). */
  kick?: boolean
  /** Il modello è caricato e animato. */
  onReady?: () => void
  /** Il tiro è finito. */
  onKickDone?: () => void
}

/**
 * Il ragazzo che palleggia: modello 3D animato (scheletro) sulla pagina di accesso.
 * Clip: "juggle" (loop), "kick_p" e "kick_n" (tiro col piede destro / sinistro, una volta).
 * È decorativo: sfondo trasparente, nessun controllo, si ferma con "riduci animazioni" o a scheda nascosta.
 */
export default function HeroModel({ kick = false, onReady, onKickDone }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const kickRequested = useRef(kick)
  const readyCb = useRef(onReady)
  const doneCb = useRef(onKickDone)

  useEffect(() => {
    kickRequested.current = kick
    readyCb.current = onReady
    doneCb.current = onKickDone
  }, [kick, onReady, onKickDone])

  useEffect(() => {
    const el = host.current
    if (!el) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = NeutralToneMapping // tiene i colori fedeli alle texture, senza bruciare i chiari
    el.appendChild(renderer.domElement)

    const scene = new Scene()
    const pmrem = new PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.5
    const key = new DirectionalLight(0xffffff, 1.1)
    key.position.set(2, 3, 4)
    scene.add(key)

    // i piedi (y = 0) cadono al ~7% dal bordo basso: l'ombra a terra in auth.css è allineata a questo valore
    const camera = new PerspectiveCamera(28, 1, 0.1, 50)
    camera.position.set(0, 0.98, 4.6)
    camera.lookAt(0, 0.98, 0)

    const stage = new Group()
    stage.rotation.y = 0.55 // di tre quarti: guarda verso il modulo di accesso, che sta a destra
    scene.add(stage)

    let mixer: AnimationMixer | undefined
    let juggle: AnimationAction | undefined
    let ball: Object3D | undefined
    const clips = new Map<string, AnimationClip>()
    let disposed = false

    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return
        gltf.scene.traverse((o) => {
          if ((o as Mesh).isMesh) o.frustumCulled = false // i limiti di una mesh con scheletro sono quelli della posa di partenza
          if (o.name === 'Ball') ball = o
        })
        stage.add(gltf.scene)
        gltf.animations.forEach((a) => clips.set(a.name, a))
        const loop = clips.get('juggle')
        if (loop) {
          mixer = new AnimationMixer(gltf.scene)
          juggle = mixer.clipAction(loop)
          juggle.play()
          if (reduced) mixer.update(0.4) // un fotogramma fermo, nessun movimento
        }
        setReady(true)
        readyCb.current?.()
      },
      undefined,
      () => {
        /* se il modello non si carica la pagina resta com'è */
      },
    )

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el
      if (w === 0 || h === 0) return
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    resize()

    // --- palleggio -> tiro: si parte dal tocco successivo, così la posa coincide con quella del palleggio ---
    let prevT = 0
    let kicking = false
    let kickElapsed = 0
    let reported = false
    const startKick = (name: string) => {
      const clip = clips.get(name)
      if (!mixer || !clip) {
        reported = true
        doneCb.current?.()
        return
      }
      const action = mixer.clipAction(clip)
      action.setLoop(LoopOnce, 1)
      action.clampWhenFinished = true
      action.reset().play()
      if (juggle) juggle.enabled = false
      kicking = true
    }

    const timer = new Timer()
    let frame = 0
    const loop = () => {
      frame = requestAnimationFrame(loop)
      if (document.hidden) return
      timer.update()
      const dt = Math.min(timer.getDelta(), 0.1) // dopo una pausa la scena non "salta"
      if (reduced || !mixer) {
        renderer.render(scene, camera)
        return
      }
      mixer.update(dt)

      if (!kicking && kickRequested.current && juggle) {
        const t = juggle.time
        if (t < prevT) startKick('kick_p') // il ciclo è ripartito: tocco col destro
        else if (prevT < LEFT_CONTACT && t >= LEFT_CONTACT) startKick('kick_n') // tocco col sinistro
        prevT = t
      } else if (!kicking && juggle) {
        prevT = juggle.time
      }

      if (kicking) {
        kickElapsed += dt
        if (ball && kickElapsed > 1.0) ball.visible = false
        if (!reported && kickElapsed >= KICK_DONE_AFTER) {
          reported = true
          doneCb.current?.()
        }
      }
      renderer.render(scene, camera)
    }
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

  return <div ref={host} className={ready ? 'hero-model is-ready' : 'hero-model'} aria-hidden="true" />
}
