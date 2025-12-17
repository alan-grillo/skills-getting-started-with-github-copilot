document.addEventListener('DOMContentLoaded', () => {
  const activitiesList = document.getElementById('activities-list');
  let activitySelect = document.getElementById('activity');
  const messageDiv = document.getElementById('message');

  if (!activitiesList) {
    console.error('Element #activities-list not found in DOM');
    return;
  }

  if (!activitySelect) {
    console.warn('Element #activity not found; creating fallback select');
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      const wrapper = signupForm.querySelector('.form-group') || signupForm;
      activitySelect = document.createElement('select');
      activitySelect.id = 'activity';
      activitySelect.required = true;
      wrapper.appendChild(activitySelect);
    } else {
      console.error('Signup form not found; cannot create activity select');
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch('/activities', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
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

            const span = document.createElement('span');
            span.className = 'participant-email';
            span.textContent = p;

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'participant-delete';
            delBtn.setAttribute('aria-label', `Remove ${p}`);
            delBtn.innerHTML = '&times;';

            delBtn.addEventListener('click', async (ev) => {
              ev.preventDefault();
              if (!confirm(`Remove ${p} from ${name}?`)) return;
              try {
                const res = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`, { method: 'DELETE' });
                if (!res.ok) {
                  const err = await res.json();
                  showMessage(err.detail || 'Failed to remove participant', 'error');
                } else {
                  const data = await res.json();
                  showMessage(data.message, 'success');
                  fetchActivities();
                }
              } catch (err) {
                showMessage('Network error', 'error');
              }
            });

            li.appendChild(span);
            li.appendChild(delBtn);
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
      activitiesList.innerHTML = '<p class="error">Failed to load activities. See console for details.</p>';
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
