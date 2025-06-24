        let currentDate = new Date();
        let events = JSON.parse(localStorage.getItem('wizardEvents')) || {};
        let selectedDate = null;
        let currentUser = null;
        let selectedUnit = 'all';

        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];

        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        const unitNames = {
            'all': 'Todas as Unidades',
            'fatima': 'Fátima',
            'parangaba': 'Parangaba',
            'washington': 'Washington Soares',
            'eusebio': 'Eusébio',
            'maracanaú': 'Maracanaú',
            'bezerra': 'Bezerra',
            'maraponga': 'Maraponga',
            'dom-luis': 'Dom Luís'
        };

        // Permission system
        const permissions = {
            'Coordenador': { canAdd: true, canDelete: true },
            'Marketing': { canAdd: true, canDelete: true },
            'Professor': { canAdd: false, canDelete: false }
        };

        function login(role) {
            currentUser = {
                role: role,
                name: `Usuário ${role}`,
                permissions: permissions[role]
            };
            
            document.getElementById('userRole').textContent = role;
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('loginModal').style.display = 'none';
            
            updatePermissions();
        }

        function logout() {
            currentUser = null;
            document.getElementById('userRole').textContent = 'Visitante';
            document.getElementById('userName').textContent = 'Não logado';
            document.getElementById('loginModal').style.display = 'flex';
            updatePermissions();
        }

        function updatePermissions() {
            const addEventBtn = document.getElementById('addEventBtn');
            const addEventModalBtn = document.getElementById('addEventModalBtn');
            const permissionDenied = document.getElementById('permissionDenied');
            
            if (currentUser && currentUser.permissions.canAdd) {
                addEventBtn.disabled = false;
                addEventModalBtn.style.display = 'inline-block';
                permissionDenied.style.display = 'none';
            } else {
                addEventBtn.disabled = true;
                addEventModalBtn.style.display = 'none';
                permissionDenied.style.display = currentUser ? 'block' : 'none';
            }
        }

        function filterByUnit() {
            selectedUnit = document.getElementById('unitFilter').value;
            generateCalendar();
        }

        function shouldShowEvent(event) {
            if (selectedUnit === 'all') return true;
            return event.unit === selectedUnit || event.unit === 'all';
        }

        function openAddEventModal() {
            if (!currentUser || !currentUser.permissions.canAdd) {
                alert('Você não tem permissão para adicionar eventos.');
                return;
            }
            
            const today = new Date();
            openModal(today.getDate());
        }

        function generateCalendar() {
            const calendar = document.getElementById('calendar');
            const monthYear = document.getElementById('monthYear');
            
            calendar.innerHTML = '';
            
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            
            monthYear.textContent = `${monthNames[month]} ${year}`;
            
            // Add day headers
            dayNames.forEach(day => {
                const dayHeader = document.createElement('div');
                dayHeader.className = 'day-header';
                dayHeader.textContent = day;
                calendar.appendChild(dayHeader);
            });
            
            // Get first day of month and number of days
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const daysInPrevMonth = new Date(year, month, 0).getDate();
            
            // Add previous month's trailing days
            for (let i = firstDay - 1; i >= 0; i--) {
                const dayCell = createDayCell(daysInPrevMonth - i, true);
                calendar.appendChild(dayCell);
            }
            
            // Add current month's days
            for (let day = 1; day <= daysInMonth; day++) {
                const dayCell = createDayCell(day, false);
                calendar.appendChild(dayCell);
            }
            
            // Add next month's leading days
            const totalCells = calendar.children.length - 7; // Subtract day headers
            const remainingCells = 42 - totalCells; // 6 rows × 7 days
            for (let day = 1; day <= remainingCells; day++) {
                const dayCell = createDayCell(day, true);
                calendar.appendChild(dayCell);
            }
        }

        function createDayCell(day, isOtherMonth) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';
            
            if (isOtherMonth) {
                dayCell.classList.add('other-month');
            }
            
            const today = new Date();
            const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            
            if (!isOtherMonth && 
                cellDate.toDateString() === today.toDateString()) {
                dayCell.classList.add('today');
            }
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayCell.appendChild(dayNumber);
            
            if (!isOtherMonth) {
                const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
                if (events[dateKey]) {
                    events[dateKey].forEach(event => {
                        if (shouldShowEvent(event)) {
                            const eventDiv = document.createElement('div');
                            eventDiv.className = `event type-${event.type}`;
                            eventDiv.textContent = event.title;
                            dayCell.appendChild(eventDiv);
                        }
                    });
                }
                
                dayCell.addEventListener('click', () => openModal(day));
            }
            
            return dayCell;
        }

        function openModal(day) {
            selectedDate = day;
            const modal = document.getElementById('eventModal');
            const modalTitle = document.getElementById('modalTitle');
            
            modalTitle.textContent = `Eventos - ${day} de ${monthNames[currentDate.getMonth()]}`;
            
            displayEvents();
            modal.style.display = 'block';
        }

        function closeModal() {
            document.getElementById('eventModal').style.display = 'none';
            clearForm();
        }

        function clearForm() {
            document.getElementById('eventTitle').value = '';
            document.getElementById('eventDescription').value = '';
            document.getElementById('eventType').value = 'meeting';
            document.getElementById('eventUnit').value = 'all';
        }

        function addEvent() {
            if (!currentUser || !currentUser.permissions.canAdd) {
                alert('Você não tem permissão para adicionar eventos.');
                return;
            }

            const title = document.getElementById('eventTitle').value.trim();
            const type = document.getElementById('eventType').value;
            const unit = document.getElementById('eventUnit').value;
            const description = document.getElementById('eventDescription').value.trim();
            
            if (!title) {
                alert('Por favor, digite um título para o evento.');
                return;
            }
            
            const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${selectedDate}`;
            
            if (!events[dateKey]) {
                events[dateKey] = [];
            }
            
            const newEvent = {
                id: Date.now(),
                title: title,
                type: type,
                unit: unit,
                description: description,
                createdBy: currentUser.role
            };
            
            events[dateKey].push(newEvent);
            saveEvents();
            clearForm();
            displayEvents();
            generateCalendar();
        }

        function deleteEvent(dateKey, eventId) {
            if (!currentUser || !currentUser.permissions.canDelete) {
                alert('Você não tem permissão para excluir eventos.');
                return;
            }

            if (confirm('Tem certeza que deseja excluir este evento?')) {
                events[dateKey] = events[dateKey].filter(event => event.id !== eventId);
                
                if (events[dateKey].length === 0) {
                    delete events[dateKey];
                }
                
                saveEvents();
                displayEvents();
                generateCalendar();
            }
        }

        function displayEvents() {
            const eventsList = document.getElementById('eventsList');
            const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${selectedDate}`;
            
            eventsList.innerHTML = '';
            
            if (events[dateKey] && events[dateKey].length > 0) {
                const filteredEvents = events[dateKey].filter(event => shouldShowEvent(event));
                
                if (filteredEvents.length > 0) {
                    filteredEvents.forEach(event => {
                        const eventItem = document.createElement('div');
                        eventItem.className = 'event-item';
                        
                        const eventInfo = document.createElement('div');
                        eventInfo.className = 'event-info';
                        
                        const eventTitle = document.createElement('h4');
                        eventTitle.textContent = event.title;
                        eventInfo.appendChild(eventTitle);
                        
                        if (event.description) {
                            const eventDesc = document.createElement('p');
                            eventDesc.textContent = event.description;
                            eventInfo.appendChild(eventDesc);
                        }
                        
                        const eventDetails = document.createElement('p');
                        eventDetails.innerHTML = `Tipo: ${getTypeLabel(event.type)} | Unidade: ${unitNames[event.unit] || 'Todas'}`;
                        eventDetails.style.fontSize = '12px';
                        eventDetails.style.color = '#999';
                        eventInfo.appendChild(eventDetails);
                        
                        eventItem.appendChild(eventInfo);
                        
                        if (currentUser && currentUser.permissions.canDelete) {
                            const deleteBtn = document.createElement('button');
                            deleteBtn.className = 'btn btn-delete';
                            deleteBtn.textContent = 'Excluir';
                            deleteBtn.onclick = () => deleteEvent(dateKey, event.id);
                            eventItem.appendChild(deleteBtn);
                        }
                        
                        eventsList.appendChild(eventItem);
                    });
                } else {
                    eventsList.innerHTML = '<p style="text-align: center; color: #666;">Nenhum evento para a unidade selecionada nesta data.</p>';
                }
            } else {
                eventsList.innerHTML = '<p style="text-align: center; color: #666;">Nenhum evento nesta data.</p>';
            }
        }

        function getTypeLabel(type) {
            const labels = {
                'meeting': 'Reunião',
                'holiday': 'Feriado',
                'training': 'Treinamento',
                'celebration': 'Comemoração',
                'deadline': 'Prazo'
            };
            return labels[type] || type;
        }

        function saveEvents() {
            localStorage.setItem('wizardEvents', JSON.stringify(events));
        }

        function previousMonth() {
            currentDate.setMonth(currentDate.getMonth() - 1);
            generateCalendar();
        }

        function nextMonth() {
            currentDate.setMonth(currentDate.getMonth() + 1);
            generateCalendar();
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('eventModal');
            if (event.target === modal) {
                closeModal();
            }
        }

        // Initialize calendar
        generateCalendar();
        updatePermissions();

        // Add some sample events with units
        if (Object.keys(events).length === 0) {
            const today = new Date();
            const sampleDateKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
            events[sampleDateKey] = [
                {
                    id: 1,
                    title: 'Reunião de Equipe',
                    type: 'meeting',
                    unit: 'fatima',
                    description: 'Reunião semanal da equipe pedagógica',
                    createdBy: 'Coordenador'
                }
            ];
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowKey = `${tomorrow.getFullYear()}-${tomorrow.getMonth()}-${tomorrow.getDate()}`;
            events[tomorrowKey] = [
                {
                    id: 2,
                    title: 'Treinamento Novo Sistema',
                    type: 'training',
                    unit: 'all',
                    description: 'Capacitação para o novo sistema de gestão',
                    createdBy: 'Marketing'
                }
            ];
            
            saveEvents();
            generateCalendar();
        }