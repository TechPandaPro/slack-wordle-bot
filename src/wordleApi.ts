function dayWordleJsonUrl() {
  const today = new Date();
  const YYYY = today.getFullYear();
  const MM = String(today.getMonth() + 1).padStart(2, "0");
  const DD = String(today.getDate()).padStart(2, "0");
  return `https://www.nytimes.com/svc/wordle/v2/${YYYY}-${MM}-${DD}.json`;
}

async function fetchWordle() {
  const url = dayWordleJsonUrl();
  const json = await (await fetch(url)).json();
  const solution: string | undefined = json.solution;
  const printDate: string | undefined = json.print_date;
  if (!solution || !printDate) return undefined;
  return { solution, printDate };
}

export { fetchWordle };
