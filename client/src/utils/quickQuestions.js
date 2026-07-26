// Quick-tap suggested questions for the live-session Q&A tab. Deliberately
// NOT an LLM call — these need to render instantly for every viewer the
// moment a product is pinned, and a handful of template questions covers the
// vast majority of what shoppers actually ask (sizing, COD, returns,
// occasion fit). Tapping one just sends it as a normal question comment.
export function generateQuickQuestions(product) {
  if (!product) return [];
  const questions = [];

  if (product.sizes?.length) {
    const size = product.sizes[Math.floor(product.sizes.length / 2)];
    questions.push(`Does size ${size} fit true to size?`);
  }
  questions.push("Is Cash on Delivery available?");
  questions.push("What's the return window on this?");
  if (product.category) {
    questions.push(`Is this good for ${/kurta|dress/i.test(product.category) ? "festive" : "everyday"} wear?`);
  }
  questions.push("Do you ship outside metro cities?");

  return questions.slice(0, 4);
}
