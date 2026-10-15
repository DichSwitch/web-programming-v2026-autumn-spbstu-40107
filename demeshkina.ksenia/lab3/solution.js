function findMostFrequent(arr) {
  const counts = new Map();

  for (const elem of arr) {
    counts.set(elem, (counts.get(elem) || 0) + 1);
  }

  let maxCount = 0;
  let mostFrequent;

  for (const [elem, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = elem;
    }
  }

  return mostFrequent;
}

export {findMostFrequent};
