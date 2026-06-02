export function getVoterId() {
  if (typeof window === "undefined") {
    return "server-user";
  }

  let voterId = localStorage.getItem("voter_id");

  if (!voterId) {
    voterId = crypto.randomUUID();
    localStorage.setItem("voter_id", voterId);
  }

  return voterId;
}