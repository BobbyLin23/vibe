<script setup lang="ts">
import Prism from "prismjs";
// Component imports are ordered so dependencies load first: markup → javascript →
// typescript → jsx → tsx.
import "prismjs/components/prism-markup";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";

const props = defineProps<{
  code: string;
  lang: string;
}>();

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// Highlight into an HTML string instead of calling `Prism.highlightAll()`: Vue owns
// the DOM, so there is nothing for Prism to rewrite after render (and this stays
// SSR-safe).
const highlightedCode = computed(() => {
  const grammar = Prism.languages[props.lang];

  return grammar ? Prism.highlight(props.code, grammar, props.lang) : escapeHtml(props.code);
});
</script>

<template>
  <pre class="m-0 rounded-none border-none bg-transparent p-2 text-xs"><code
      :class="`language-${lang}`"
      v-html="highlightedCode"
    /></pre>
</template>
