export function emailValidate(email: string) {
  return email.split("@").length === 2;
}

export function phoneValidate(phone: string) {
  const DIGITS = "1234567890";
  if (phone.length !== 9) {
    return false;
  }
  return phone.split("").every((char) => {
    return DIGITS.includes(char);
  });
}
