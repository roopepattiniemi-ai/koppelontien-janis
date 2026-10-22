B='62.3658,22.9030,62.3878,22.9510'
Q="[out:json][timeout:90];(way[highway]($B);way[landuse]($B);relation[landuse]($B);way[natural]($B);relation[natural]($B);way[waterway]($B);way[building]($B););out geom;"
w=15; for i in 1 2 3 4 5 6; do for u in https://overpass-api.de/api/interpreter https://overpass.private.coffee/api/interpreter https://maps.mail.ru/osm/tools/overpass/api/interpreter; do
 timeout 120 curl -s -A "koppelontien-janis/0.7 (peliprojekti)" --data-urlencode "data=$Q" $u > raaka.json; if head -c 20 raaka.json | grep -q '{'; then echo OK $u; exit 0; fi; echo fail $u; done; sleep $w; w=$((w*2)); done
