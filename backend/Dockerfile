# ─── Stage 1 : Build Maven ───────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /workspace

# Copier pom.xml en premier pour le cache des dépendances
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    mvn dependency:go-offline -B --no-transfer-progress 2>/dev/null || true

COPY src ./src

RUN --mount=type=cache,target=/root/.m2 \
    mvn package -DskipTests -B --no-transfer-progress && \
    mkdir -p target/dependency && \
    cd target/dependency && \
    jar -xf ../*.jar

# ─── Stage 2 : Runtime JRE (image légère) ───────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Dépendances
ARG DEPENDENCY=/workspace/target/dependency
COPY --from=builder ${DEPENDENCY}/BOOT-INF/lib     /app/lib
COPY --from=builder ${DEPENDENCY}/META-INF          /app/META-INF
COPY --from=builder ${DEPENDENCY}/BOOT-INF/classes  /app

# Sécurité : utilisateur non-root
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-cp", ".:lib/*", \
    "com.spinmylunch.SpinMyLunchApplication"]
