#!/bin/sh
# ET Server Status Poller — runs every 60s
# Uses netcat for UDP query (works where Node dgram doesn't)

echo "ET Server Status Poller started"
echo "Target: 84.229.240.21:27960"
echo "Interval: 60s"

while true; do
  RAW=$(printf '\xff\xff\xff\xffgetstatus\n' | nc -u -w 3 84.229.240.21 27960 2>/dev/null || true)

  if echo "$RAW" | grep -q "statusResponse"; then
    VARS=$(echo "$RAW" | sed -n '2p')
    HOSTNAME=$(echo "$VARS" | grep -oP '(?<=\\sv_hostname\\)[^\\]+' | sed 's/\^[0-9a-zA-Z]//g')
    MAP=$(echo "$VARS" | grep -oP '(?<=\\mapname\\)[^\\]+')
    MAXCLIENTS=$(echo "$VARS" | grep -oP '(?<=\\sv_maxclients\\)[^\\]+')

    PLAYERS="["
    FIRST=true
    while IFS= read -r line; do
      if echo "$line" | grep -qP '^\-?\d+ \d+ "'; then
        SCORE=$(echo "$line" | awk '{print $1}')
        PING=$(echo "$line" | awk '{print $2}')
        NAME=$(echo "$line" | grep -oP '"[^"]+"' | tr -d '"' | sed 's/\^[0-9a-zA-Z]//g')
        if [ "$PING" -gt 0 ] 2>/dev/null; then
          if [ "$FIRST" = true ]; then FIRST=false; else PLAYERS="$PLAYERS,"; fi
          PLAYERS="$PLAYERS{\"name\":\"$NAME\",\"score\":$SCORE,\"ping\":$PING}"
        fi
      fi
    done <<EOF
$(echo "$RAW" | tail -n +3)
EOF
    PLAYERS="$PLAYERS]"

    curl -sf -X PATCH "$SUPABASE_URL/rest/v1/server_status?id=eq.1" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"online\":true,\"hostname\":\"$HOSTNAME\",\"map\":\"$MAP\",\"players\":$PLAYERS,\"max_players\":${MAXCLIENTS:-20},\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"

    echo "[$(date -u +%H:%M:%S)] ONLINE - $MAP - $(echo "$PLAYERS" | grep -o '"name"' | wc -l | tr -d ' ') players"
  else
    curl -sf -X PATCH "$SUPABASE_URL/rest/v1/server_status?id=eq.1" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"online\":false,\"hostname\":\"\",\"map\":\"\",\"players\":[],\"max_players\":0,\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"

    echo "[$(date -u +%H:%M:%S)] OFFLINE"
  fi

  # Purge Vercel cache
  curl -sf "https://et-gather.vercel.app/api/revalidate?token=$REVALIDATION_TOKEN" > /dev/null 2>&1 || true

  sleep 60
done
