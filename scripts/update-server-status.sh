#!/bin/bash
# Queries the ET server via UDP and writes status to Supabase
# Run this as a cron job: */1 * * * * /path/to/update-server-status.sh

SUPABASE_URL="${SUPABASE_URL:-https://jcjystrqbczcjiadgnfg.supabase.co}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [ -z "$SUPABASE_KEY" ]; then
  echo "SUPABASE_SERVICE_ROLE_KEY is required"
  exit 1
fi

# Query server
RAW=$(printf '\xff\xff\xff\xffgetstatus\n' | nc -u -w 3 84.229.240.21 27960 2>/dev/null)

if echo "$RAW" | grep -q "statusResponse"; then
  # Parse server info
  VARS=$(echo "$RAW" | sed -n '2p')
  HOSTNAME=$(echo "$VARS" | grep -oP '(?<=\\sv_hostname\\)[^\\]+' | sed 's/\^[0-9a-zA-Z]//g')
  MAP=$(echo "$VARS" | grep -oP '(?<=\\mapname\\)[^\\]+')
  MAXCLIENTS=$(echo "$VARS" | grep -oP '(?<=\\sv_maxclients\\)[^\\]+')

  # Parse players as JSON array
  PLAYERS="["
  FIRST=true
  while IFS= read -r line; do
    if echo "$line" | grep -qP '^\d+ \d+ "'; then
      SCORE=$(echo "$line" | awk '{print $1}')
      PING=$(echo "$line" | awk '{print $2}')
      NAME=$(echo "$line" | grep -oP '"[^"]+"' | tr -d '"' | sed 's/\^[0-9a-zA-Z]//g')
      if [ "$PING" -gt 0 ] 2>/dev/null; then
        if [ "$FIRST" = true ]; then FIRST=false; else PLAYERS="$PLAYERS,"; fi
        PLAYERS="$PLAYERS{\"name\":\"$NAME\",\"score\":$SCORE,\"ping\":$PING}"
      fi
    fi
  done <<< "$(echo "$RAW" | tail -n +3)"
  PLAYERS="$PLAYERS]"

  # Update Supabase
  curl -s -X PATCH "$SUPABASE_URL/rest/v1/server_status?id=eq.1" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"online\":true,\"hostname\":\"$HOSTNAME\",\"map\":\"$MAP\",\"players\":$PLAYERS,\"max_players\":${MAXCLIENTS:-20},\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"

  echo "Updated: $HOSTNAME - $MAP - $(echo "$PLAYERS" | grep -o '"name"' | wc -l) players"
else
  # Server offline
  curl -s -X PATCH "$SUPABASE_URL/rest/v1/server_status?id=eq.1" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"online\":false,\"hostname\":\"\",\"map\":\"\",\"players\":[],\"max_players\":0,\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"

  echo "Server offline"
fi
