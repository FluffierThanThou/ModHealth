@{%
	const lexer = require("./lexer.js");
%}

@lexer lexer

log -> %timestamp Mods Patches:? Harmony:? Platform:? Content								{% ([time, mods, patches, harmony, platform, logs]) => { return { 
																								time: time.value, 
																								mods, 
																								patches: patches || [],
																								harmony: harmony || [],
																								platform: platform ? platform.value : "unknown",
																								logs } } %}

Mods -> %mods Mod:+ %end																	{% ([_, ms ]) => ms %}
Mod -> %modName Assemblies %br:?															{% ([n, ass]) => { return { name: n.value, assemblies: ass } } %}
Assemblies -> %noAssemblies 																{% () => [] %}
	| Assembly:+																			{% id %}
Assembly -> %assemblyName %assemblyVersion %comma:?											{% ([a,v]) => { return { assembly: a.value, version: v.value } }%}

Patches -> %patches Patch:+ %end															{% ([_, ps]) => ps.flat(2) %} # no idea why flat(2) is necessary
Patch -> %patchTarget PatchSet:+ %end														{% ([t, ps]) => ps.map( px => px.map( p => { return { target: t.value, ...p } } ) ) %}
	| %patchTarget %noPatches %br 															{% () => null %}
PatchSet -> %patchOperator ( %patchMethod %comma:? {% d => d[0] %} ):+ %end					{% ([op, ms]) => ms.map( m => { return { operator: op.value, method: m.value } } )  %}

Harmony -> %harmony HarmonyInstanceSet:+ %end												{% ([_, sets, __]) => sets %}
	| %harmony ( %harmonyInstance %harmonyVersion {% ([i,v]) => { return { identifier: i.value, version: v.value } } %} ):+ %end	{% ([_, is, __]) => is %}
HarmonyInstanceSet -> %harmonyVersion ( %harmonyInstance %space:? {% d => d[0] %} ):+		{% ([v, is]) => is.map(i => { return { identifier: i.value, version: v.value} }) %}

Platform -> %platform %line:* %end															{% ([_, p, __]) => p.join("\n") %}

Content -> %content Entry:*																	{% ([content, entries]) => entries %}
Entry -> %entry %br:*												 						{% ([entry, brs]) => entry.value %}