function findMaxSubarraySum(arr, n) {
  if (!Array.isArray(arr)) {
    throw new TypeError('First argument must be an Array');
  }
  if (typeof n !== 'number' || !Number.isInteger(n)) {
    throw new TypeError('Subarray size n must be an integer');
  }

  const len = arr.length;
  if (n <= 0 || len === 0 || n > len) {
    return null;
  }

  for (let i = 0; i < len; i++) {
    const val = arr[i];
    if (typeof val !== 'number' || Number.isNaN(val)) {
      throw new TypeError(`Element at index ${i} is not a valid number`);
    }
  }

  let windowSum = 0;
  for (let i = 0; i < n; i++) {
    windowSum += arr[i];
  }

  let maxSum = windowSum;

  for (let i = n; i < len; i++) {
    windowSum += arr[i] - arr[i - n];
    if (windowSum > maxSum) {
      maxSum = windowSum;
    }
  }

  return maxSum;
}

export {findMaxSubarraySum};
