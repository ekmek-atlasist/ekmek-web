let employerSigningOut = false;

export function beginEmployerSignOut() {
  employerSigningOut = true;
}

export function isEmployerSigningOut() {
  return employerSigningOut;
}

export function finishEmployerSignOut() {
  employerSigningOut = false;
}
