# Construye la lista de operaciones (archivos nuevos y pares Busca/Pon) de base → mod para fabrica-servicio y la valida.
import os, json, difflib
import sys
# Uso: python3 genpares.py <carpeta del lote> (con base/ = fabrica-servicio de producción y mod/ = el lote)
S=os.path.abspath(sys.argv[1]); B=S+"/base"; M=S+"/mod"
ops=[]
cambiados=[]
for raiz,_,fs in os.walk(M):
    for f in fs:
        r=os.path.relpath(os.path.join(raiz,f),M)
        if r.startswith('.git/'): continue
        b=os.path.join(B,r)
        nuevo=open(os.path.join(M,r),encoding='utf-8').read()
        if not os.path.exists(b): ops.append({'tipo':'nuevo','ruta':r,'texto':nuevo}); cambiados.append(r); continue
        viejo=open(b,encoding='utf-8').read()
        if viejo==nuevo: continue
        cambiados.append(r)
        # pares por bloques de diff con 2 líneas de contexto, ampliados hasta ser únicos
        a=viejo.split('\n'); c=nuevo.split('\n')
        sm=difflib.SequenceMatcher(None,a,c,autojunk=False)
        for tag,i1,i2,j1,j2 in sm.get_opcodes():
            if tag=='equal': continue
            ctx=1
            while True:
                lo=max(0,i1-ctx); hi=min(len(a),i2+ctx)
                busca='\n'.join(a[lo:hi])
                pon='\n'.join(a[lo:i1]+c[j1:j2]+a[i2:hi])
                if busca and viejo.count(busca)==1: break
                ctx+=1
            ops.append({'tipo':'par','ruta':r,'busca':busca,'pon':pon})
json.dump(ops,open(S+'/ops.json','w'),ensure_ascii=False,indent=1)
print(sorted(cambiados)); print(len(ops),'operaciones')
