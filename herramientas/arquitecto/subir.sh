#!/bin/bash
# subir.sh "<mensaje de commit>" "<ids míos nuevos del buzón, coma, o vacío>"
# Commit + rebase sobre origin/main (si choca: fusión del buzón y SOLO mis archivos sobre origin/main) + validar + push con el token staged.
# El token se lee de la copia staged y se borra; nunca se imprime.
set -u
R=/home/claude/work/str-manager-docs; S=/home/claude/work; F=/mnt/user-data/uploads/Downloads/str-instr-cola/claves/arquitecto.txt
MSG="$1"; IDS="${2:-}"
cd "$R" || exit 1
TRAIL="Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01So4JYcPtDhCMJ26Mk7X43s"
git add -A
git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -m "$MSG" -m "$TRAIL" 2>/dev/null || true
sleep 1; T=$(tr -d '\r\n ' < "$F" 2>/dev/null); rm -f "$F"
[ -z "$T" ] && { echo SIN_TOKEN; exit 2; }
for i in 1 2 3; do
  git fetch -q
  if [ -n "$(git log --oneline HEAD..origin/main)" ]; then
    MIOS=$(git diff-tree --no-commit-id --name-only -r HEAD)   # archivos de mi último commit
    if ! git -c user.name=arq -c user.email=arq@local rebase -q origin/main 2>/dev/null; then
      git rebase --abort
      git show HEAD:interno/mensajes.json > $S/mio.json; git show origin/main:interno/mensajes.json > $S/origen.json
      python3 -I $S/scripts/buzon-merge.py $S/mio.json $S/origen.json $S/salida.json "$IDS" || { echo MERGE_FALLA; break; }
      # Mis archivos (menos el buzón) se conservan de mi commit; TODO lo demás se toma de origin/main
      BASE=$(git merge-base HEAD origin/main)
      mkdir -p $S/mios; for f in $MIOS; do [ "$f" = interno/mensajes.json ] && continue; mkdir -p "$S/mios/$(dirname $f)"; git show HEAD:"$f" > "$S/mios/$f" 2>/dev/null
        # si origin también cambió el archivo, fusión a tres bandas (mío + suyo sobre la base); si choca, se queda el mío y se avisa
        if ! git diff --quiet $BASE origin/main -- "$f"; then git show $BASE:"$f" > "$S/mios/$f.base" 2>/dev/null; git show origin/main:"$f" > "$S/mios/$f.suyo" 2>/dev/null
          if git merge-file -p "$S/mios/$f" "$S/mios/$f.base" "$S/mios/$f.suyo" > "$S/mios/$f.fus" 2>/dev/null; then mv "$S/mios/$f.fus" "$S/mios/$f"; echo "fusionado a tres bandas: $f"; else echo "CHOQUE en $f: se queda mi versión; revisa a mano"; fi; fi; done
      git reset -q --hard origin/main
      for f in $MIOS; do [ "$f" = interno/mensajes.json ] && continue; [ -f "$S/mios/$f" ] && { mkdir -p "$(dirname $f)"; cp "$S/mios/$f" "$f"; }; done
      rm -rf $S/mios
      python3 -I -c "import json,sys; [json.load(open(f,encoding='utf-8')) for f in sys.argv[1:] if f.endswith('.json')]" $MIOS || { echo JSON_ROTO; git reset -q --hard origin/main; break; }
      cp $S/salida.json interno/mensajes.json
      git add -A; git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -m "$MSG" -m "$TRAIL"
    fi
  fi
  python3 -I herramientas/modelo/validar.py . 2>&1 | grep -q "Errores: 0" || { echo VALIDAR_FALLA; break; }
  if git -c http.extraheader="AUTHORIZATION: basic $(printf 'x-access-token:%s' "$T" | base64 -w0)" push -q origin HEAD:main 2>/dev/null; then echo PUSH_OK; break; else echo "reintento $i"; sleep 3; fi
done
unset T
git log --oneline -1
