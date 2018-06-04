export const gql = (strs: TemplateStringsArray) => {
  if (strs.length !== 1) {
    throw new Error("The gql tag can't handle complex template strings.")
  }
  return strs[0]
}
