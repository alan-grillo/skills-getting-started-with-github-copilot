document.addEventListener('DOMContentLoaded', () => {
  const activitiesList = document.getElementById('activities-list');
  const activitySelect = document.getElementById('activity');
  const messageDiv = document.getElementById('message');

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch('/activities');
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = '';

      // Populate activities list
      for (const [name, info] of Object.entries(activities)) {
        const card = document.createElement('div');
        card.className = 'activity-card';

        const title = document.createElement('h4');
        title.textContent = name;

        const desc = document.createElement('p');
        desc.textContent = info.description;

        const schedule = document.createElement('p');
        schedule.innerHTML = `<strong>Schedule:</strong> ${info.schedule}`;

        const spotsLeft = Math.max(0, info.max_participants - (info.participants?.length || 0));
        const availability = document.createElement('p');
        availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        // Participants section (new)
        const participantsSection = document.createElement('div');
        participantsSection.className = 'participants-section';

        const participantsTitle = document.createElement('div');
        participantsTitle.className = 'participants-title';
        participantsTitle.textContent = 'Participants';

        const ul = document.createElement('ul');
        ul.className = 'participants-list';

        if (info.participants && info.participants.length > 0) {
          info.participants.forEach(p => {
            const li = document.createElement('li');
            li.textContent = p;
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement('li');
          li.className = 'muted';
          li.textContent = 'No participants yet';
          ul.appendChild(li);
        }

        participantsSection.appendChild(participantsTitle);
        participantsSection.appendChild(ul);

        // Assemble card
        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(schedule);
        card.appendChild(availability);
        card.appendChild(participantsSection);

        activitiesList.appendChild(card);

        // Add option to select dropdown
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      }
    } catch (error) {
      activitiesList.innerHTML = '<p>Failed to load activities. Please try again later.</p>';
      console.error('Error fetching activities:', error);
    }
  }

  // Handle form submission
  document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const activity = document.getElementById('activity').value;

    if (!email || !activity) {
      showMessage('Please provide an email and select an activity', 'error');
      return;
    }

    try {
      const res = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: 'POST',
        }
      );

      if (!res.ok) {
        const err = await res.json();
        showMessage(err.detail || 'Signup failed', 'error');
      } else {
        const data = await res.json();
        showMessage(data.message, 'success');
        document.getElementById('signup-form').reset();
        fetchActivities();
      }
    } catch (err) {
      showMessage('Network error', 'error');
    }
  });

  function showMessage(text, type) {
    messageDiv.className = '';
    messageDiv.classList.add('message');
    messageDiv.classList.add(type === 'success' ? 'success' : 'error');
    messageDiv.textContent = text;
    messageDiv.classList.remove('hidden');
    setTimeout(() => {
      messageDiv.classList.add('hidden');
    }, 5000);
  }

  // Initialize app
  fetchActivities();
});
