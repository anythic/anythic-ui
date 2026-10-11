/** Yields `text` a word at a time with jittered delays, like a model would. */
export async function* fakeStream(text: string, delay = 60): AsyncGenerator<string> {
  for (const word of text.split(/(?<= )/)) {
    await new Promise((resolve) => setTimeout(resolve, delay + Math.random() * delay));
    yield word;
  }
}
