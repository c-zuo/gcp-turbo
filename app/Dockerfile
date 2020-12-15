FROM alpine:latest  

RUN apk add --update npm
RUN mkdir -p /app/frontend
COPY frontend/ /app/frontend
RUN rm -rf /app/frontend/build/*
RUN cd /app/frontend && npm install && npm run build
RUN ls -l /app/frontend /app/frontend/build

FROM python:3.7-buster
RUN apt-get update && apt-get dist-upgrade -y
RUN rm -rf /app/static && mkdir -p /app/static
COPY --from=0 /app/frontend/build/* /app/static/
COPY backend/ /app/

ENV PORT 8080
ENV PYTHONUNBUFFERED True
WORKDIR /app
RUN pip3 install -r requirements.txt
RUN sed -i -e 's/http:\/\/localhost:5000//g' /app/static/index.html

CMD [ "waitress-serve", "--call", "main:create_app" ]
