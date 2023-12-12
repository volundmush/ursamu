FROM denoland/deno:alpine

RUN apk update && apk add alpine-sdk bash
RUN mkdir /ursamu
WORKDIR /ursamu
ADD deps.ts LICENSE README.md pup pup.jsonc ursamu_github_banner.png /ursamu/
ADD help/ /ursamu/help/
ADD src/ /ursamu/src/
RUN mkdir /ursamu/data

VOLUME /ursamu/data
VOLUME /ursamu/text

CMD ["-c", "./pup run"]
ENTRYPOINT ["/bin/bash"]

# telnet, ws, http
EXPOSE 4201 4202 4203
