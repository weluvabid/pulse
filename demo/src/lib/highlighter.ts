import type { HighlighterCore, ThemedToken } from 'shiki/core';

export type HighlightedToken = {
  content: string;
  style?: string;
  class?: string;
};

export type HighlightedLine = string | HighlightedToken[];

let highlighterPromise: Promise<HighlighterCore> | undefined;

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
    import('shiki/themes/github-light.mjs'),
    import('shiki/themes/github-dark.mjs'),
  ]).then(async ([core, engine, lightTheme, darkTheme]) => {
    const highlighter = await core.createHighlighterCore({
      themes: [lightTheme, darkTheme],
      langs: [],
      engine: engine.createJavaScriptRegexEngine({ forgiving: true }),
    });

    await highlighter.loadLanguage(() => import('shiki/langs/typescript.mjs'));
    return highlighter;
  });

  return highlighterPromise;
}

function toHighlightedLine(tokens: ThemedToken[]): HighlightedToken[] {
  return tokens.map((token) => ({
    content: token.content,
    style: Object.entries(token.htmlStyle ?? {})
      .map(([property, value]) => `${property}:${value}`)
      .join(';'),
    class: 'text-(--shiki-light) dark:text-(--shiki-dark)',
  }));
}

export async function highlightCode(code: string): Promise<HighlightedLine[] | null> {
  const highlighter = await getHighlighter();
  const result = highlighter.codeToTokens(code, {
    lang: 'typescript',
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  });

  return result.tokens.map(toHighlightedLine);
}
