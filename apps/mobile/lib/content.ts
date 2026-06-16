export interface Article {
  id: string;
  title: string;
  topic: string;
  minutes: number;
}

export async function fetchMostRead(): Promise<Article[]> {
  // Simulates a backend fetch per the specification
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 'gender-identity-development', title: 'Gender Identity Development', topic: 'Men’s mental health', minutes: 5 },
        { id: 'anxiety-toolkit',             title: 'Building Your Anxiety Management Toolkit', topic: 'Anxiety & stress', minutes: 5 },
        { id: 'alexithymia',                 title: 'Alexithymia: When You Can’t Name a Feeling', topic: 'Emotional regulation', minutes: 8 },
        { id: 'animal-assisted-dementia',    title: 'Animal-Assisted Therapy and Dementia', topic: 'Aging & late-life', minutes: 6 },
      ]);
    }, 400); // slight delay to simulate network
  });
}
