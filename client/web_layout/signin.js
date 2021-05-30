document.addEventListener('submit', function (event) {

	event.preventDefault();

	const data = new URLSearchParams();
	for (const pair of new FormData(event.target)) {
		data.append(pair[0], pair[1]);
	}

	fetch('/signin', {
		method: 'POST',
		body: data,
	}).then(async function (response) {
		if (response.ok) {
			return response.json();
		}
		let el = document.createElement("h3");
		el.style.color = "red"
		el.textContent = await response.text();
		document.body.appendChild(el);
		return Promise.reject(response);
	}).then(function (data) {
		window.location.href = "https://localhost:" + data.port + "/options.html";
	}).catch((error) => {

	});
});