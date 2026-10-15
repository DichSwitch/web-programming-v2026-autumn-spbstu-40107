function reverseWords(str) {
  if (typeof str !== 'string') {
    throw new TypeError('Argument must be a string');
  }

  return str
    .split(' ')
    .map((word) => word.split('').reverse().join(''))
    .join(' ');
}

export {reverseWords};
