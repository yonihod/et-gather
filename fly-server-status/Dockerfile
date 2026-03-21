FROM alpine:3.19
RUN apk add --no-cache curl netcat-openbsd grep gawk coreutils
WORKDIR /app
COPY poll.sh .
RUN chmod +x poll.sh
CMD ["sh", "poll.sh"]
