export function jobMatchesPay(salary: string | undefined, min = 0, max = 100): boolean {
  const text = (salary || '').trim();
  if (!text || /consultar|n\/a|not specified/i.test(text)) {
    return true;
  }
  const values = [...text.matchAll(/(\d+(?:\.\d+)?)/g)].map((match) => Number(match[1]));
  if (!values.length) {
    return true;
  }
  const jobHigh = Math.max(...values);
  const jobLow = /up\s*to|até/i.test(text) ? 0 : Math.min(...values);
  return jobLow <= max && jobHigh >= min;
}
