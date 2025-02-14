document.addEventListener("DOMContentLoaded", () => {
    const authButton = document.getElementById("authButton");
    const loader = document.getElementById("loader");
    const calendarHeader = document.getElementById("calendarHeader");
    const calendarBody = document.getElementById("calendarBody");
    const profilePopup = document.getElementById("profilePopup");
    const profilePhoto = document.getElementById("profilePhoto");
    const profileName = document.getElementById("profileName");
    const closeProfilePopup = document.getElementById("closeProfilePopup");
    const monthSelector = document.getElementById("month");
    const themeToggle = document.getElementById("theme");

    // Dark Mode Toggle Persistence
    themeToggle.checked = localStorage.getItem("darkMode") === "true";
    document.body.setAttribute("data-theme", themeToggle.checked ? "dark" : "light");

    themeToggle.addEventListener("change", () => {
        document.body.setAttribute("data-theme", themeToggle.checked ? "dark" : "light");
        localStorage.setItem("darkMode", themeToggle.checked);
    });

    // Check if user is already authenticated
    fetch("/auth/status")
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                authButton.style.display = "none";
            }
        })
        .catch(error => console.error("Error checking auth status:", error));

    // Fetch Activities
    const fetchActivities = async (month = "current") => {
        loader.style.display = "block";
        calendarHeader.innerHTML = "";
        calendarBody.innerHTML = "";

        try {
            const response = await fetch(`/activities?month=${month}`);
            const { activities } = await response.json();
            
            activities.forEach(activity => {
                const row = document.createElement("tr");
                const cell = document.createElement("td");
                cell.textContent = activity.athlete.firstname + " " + activity.athlete.lastname;
                cell.style.cursor = "pointer";
                cell.addEventListener("click", () => showProfile(activity.athlete));
                row.appendChild(cell);
                calendarBody.appendChild(row);
            });
        } catch (error) {
            console.error("Error fetching activities:", error);
        } finally {
            loader.style.display = "none";
        }
    };

    const showProfile = (athlete) => {
        profilePhoto.src = athlete.profile || "default-profile.png";
        profileName.textContent = `${athlete.firstname} ${athlete.lastname}`;
        profilePopup.style.display = "flex";
    };

    closeProfilePopup.addEventListener("click", () => {
        profilePopup.style.display = "none";
    });

    monthSelector.addEventListener("change", (event) => {
        fetchActivities(event.target.value);
    });

    authButton.addEventListener("click", () => {
        window.location.href = "/auth/strava";
    });

    fetchActivities();
});
