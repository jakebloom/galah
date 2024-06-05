function onSubmit(e) {
  e.preventDefault();

  document.getElementById("submit-button").style.display = "none";
  document.getElementById("loading-indicator").style.display = "inherit";

  const name = e.target.elements.name.value;
  const email = e.target.elements.email.value;

  fetch("https://addlead-kahnxzekya-uc.a.run.app", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
    }),
    headers: {
      'Content-Type': "application/json",
    },
  }).then(res => res.text())
  .then(() => {
    window.location.href = "https://galah.lol/thanks"
  });
}