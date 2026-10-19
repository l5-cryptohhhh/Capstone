# Immagine del backend per Render (che non ha un ambiente Java nativo).
# Due stadi: nel primo si compila con Maven, nel secondo resta solo il JRE e il jar, per un'immagine leggera.

FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
# Prima solo il pom: lo strato delle dipendenze si riusa finché il pom non cambia
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q -Dmaven.test.skip=true package && mv target/*.jar target/app.jar

FROM eclipse-temurin:25-jre
WORKDIR /app
# Il processo non gira come root
RUN useradd --system --uid 10001 scoutai
COPY --from=build /app/target/app.jar app.jar
USER scoutai

# Il piano gratuito di Render ha 512 MB: heap al 70% della memoria del container e garbage collector leggero
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
