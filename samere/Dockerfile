FROM maven:3.9.1-eclipse-temurin-21 AS build

WORKDIR /app

COPY samere/pom.xml .
COPY samere/src ./src

RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/samere-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
