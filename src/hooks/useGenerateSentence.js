import { useCallback } from "react";

export const useGenerateSentence = () => {
  const nouns = [
    "cat",
    "dog",
    "teacher",
    "car",
    "river",
    "child",
    "bird",
    "computer",
    "garden",
    "player",
    "music",
    "mountain",
    "ocean",
    "pencil",
    "house",
    "city",
    "forest",
    "clock",
    "cloud",
    "book",
  ];

  const verbs = [
    "runs",
    "jumps",
    "reads",
    "writes",
    "sleeps",
    "drives",
    "plays",
    "flies",
    "laughs",
    "thinks",
    "walks",
    "talks",
    "builds",
    "creates",
    "learns",
    "teaches",
    "watches",
    "draws",
    "moves",
    "explores",
  ];

  const adjectives = [
    "happy",
    "tall",
    "fast",
    "bright",
    "lazy",
    "quiet",
    "strong",
    "gentle",
    "curious",
    "clever",
    "brave",
    "friendly",
    "shy",
    "energetic",
    "calm",
    "wise",
    "colorful",
    "serious",
    "young",
    "old",
  ];

  const adverbs = [
    "quickly",
    "slowly",
    "loudly",
    "quietly",
    "eagerly",
    "gracefully",
    "carefully",
    "boldly",
    "softly",
    "suddenly",
    "rarely",
    "often",
    "usually",
    "barely",
    "almost",
    "truly",
    "nearly",
    "simply",
    "honestly",
    "finally",
  ];

  const prepositions = [
    "under",
    "above",
    "across",
    "behind",
    "beside",
    "between",
    "through",
    "around",
    "near",
    "inside",
  ];

  // Helper to get random text from an array
  const rand = (array) => array[Math.floor(Math.random() * array.length)];
  const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

  const generateSentence = useCallback(() => {
    const templates = [
      // Simple compound sentences
      `The ${rand(adjectives)} ${rand(nouns)} ${rand(verbs)} ${rand(
        adverbs
      )} ${rand(prepositions)} the ${rand(adjectives)} ${rand(
        nouns
      )}, and then ${rand(verbs)} again before sunset.`,
      `After a long day, the ${rand(nouns)} ${rand(adverbs)} ${rand(
        verbs
      )} while the ${rand(adjectives)} ${rand(nouns)} ${rand(verbs)} nearby.`,

      // Slightly narrative-style
      `${capitalize(rand(nouns))} ${rand(verbs)} ${rand(adverbs)} ${rand(
        prepositions
      )} a ${rand(adjectives)} ${rand(nouns)}, trying to ${rand(
        verbs
      )} before the ${rand(nouns)} ${rand(verbs)} again.`,
      `Every morning, the ${rand(adjectives)} ${rand(nouns)} ${rand(
        verbs
      )} ${rand(adverbs)} as the ${rand(nouns)} ${rand(
        verbs
      )} in the distance.`,

      // Descriptive pattern
      `A ${rand(adjectives)} ${rand(nouns)} ${rand(verbs)} ${rand(
        adverbs
      )} ${rand(prepositions)} the ${rand(nouns)}, ${rand(
        verbs
      )} again as the ${rand(adjectives)} ${rand(nouns)} watches.`,
      `Sometimes the ${rand(nouns)} ${rand(verbs)} ${rand(adverbs)} ${rand(
        prepositions
      )} the ${rand(adjectives)} ${rand(nouns)} and ${rand(
        verbs
      )} until night.`,

      // Time/conditional sentence
      `When the ${rand(nouns)} ${rand(verbs)} ${rand(adverbs)}, a ${rand(
        adjectives
      )} ${rand(nouns)} ${rand(verbs)} ${rand(prepositions)} the ${rand(
        adjectives
      )} ${rand(nouns)} without stopping.`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return generateSentence;
};
