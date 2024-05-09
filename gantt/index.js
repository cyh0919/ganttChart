const app = Vue.createApp({
    data() {
        return {
            currentDate: new Date(),
            newTask: '',
            //新增起訖點
            newdate: '',
            startTimestamp: 0,
            endTimestamp: 0,
            //編輯起訖點
            editdate: '',
            editStartTimestamp: 0,
            editEndTimestamp: 0,
            //最大最小時間戳避免效能問題
            todoList: [
                {
                    title: '代辦事項1',
                    complete: true,
                    startTimestamp: 1715040000,
                    endTimestamp: 1715040000,
                    grid: [1, 1, 2, 2],
                    formattedDate: '5/7 - 5/7'
                }
            ],
            editingKey: null, // 正在編輯的項目索引
            editedTitle: '', // 編輯中的標題

            minStartTimestamp: 0,
            maxEndTimestamp: 0,

            filter: 'all', //過濾條件
            width: 100,
            unit: 0,
            dateForm: 'days',
        }
    },
    computed: {
        //過濾
        filteredTodos: function () {
            if (this.filter === 'all') {
                return this.todoList;
            } else if (this.filter === 'ing') {
                let newTodos = [];
                this.todoList.forEach((item => {
                    if (!item.complete) {
                        newTodos.push(item);
                    }
                }))
                return newTodos;
            } else if (this.filter === 'completed') {
                let newTodos = [];
                this.todoList.forEach((item => {
                    if (item.complete) {
                        newTodos.push(item);
                    }
                }))
                return newTodos;
            }
        },
        //計算剩餘任務
        countIngMission: function () {
            return this.todoList.filter(todo => todo.complete != true);
        },
        dateRange() {
            let minDate = new Date(this.minStartTimestamp * 1000);
            let maxDate = new Date(this.maxEndTimestamp * 1000);
            let currentDate = new Date(minDate);
            currentDate.setDate(currentDate.getDate() - 1);

            let datediff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
            let dateRange = [];
            if (datediff < 100) {
                for (let i = 0; i < 100; i++) {
                    const dateInfo = {
                        year: currentDate.getFullYear(),
                        month: currentDate.getMonth() + 1,
                        day: currentDate.getDate(),
                        dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }).slice(0, 3),
                    }
                    dateRange.push(dateInfo);
                    currentDate.setDate(currentDate.getDate() + 1); // 后一天
                }
            } else {
                while (currentDate <= maxDate) {
                    const dateInfo = {
                        year: currentDate.getFullYear(),
                        month: currentDate.getMonth() + 1,
                        day: currentDate.getDate(),
                        dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }).slice(0, 3),
                    }
                    dateRange.push(dateInfo);
                    currentDate.setDate(currentDate.getDate() + 1); // 后一天
                }
            }

            this.unit = dateRange.length; // 设置 unit 数据属性
            return dateRange;
        },
        filterDateRange() {
            let dateRange = this.dateRange
            let filterdate = []
            switch (this.dateForm) {
                case 'days':
                    filterdate = dateRange;
                    break;
                case '2days':
                    filterdate = dateRange.filter((item, index) => (index + 1) % 2 !== 0);
                    break;
                case '4days':
                    filterdate = dateRange.filter((item, index) => index % 4 === 0);
                    break;
                case 'weeks':
                    filterdate = dateRange.filter((item, index) => index % 7 === 0);
                    break;
                case '2weeks':
                    filterdate = dateRange.filter((item, index) => index % 14 === 0);
                    break;
                case 'mouth':
                    const filteredRange = [];
                    let currentMonth = -1;

                    dateRange.forEach(item => {
                        const month = item.month;
                        if (month !== currentMonth) {
                            filterdate.push(item);
                            currentMonth = month;
                        }
                    });
                    break;
                default:
                    break;
            }

            return filterdate
        },
        modifiedWidth() {
            let x = this.width;
            let y = 120; // 默认值

            if (x < 10) {
                y = 24;
            } else if (x < 20) {
                y = 30;
            } else if (x < 40) {
                y = 40;//錯
            } else if (x < 60) {
                y = 75;
            } else if (x < 80) {
                y = 100;
            }

            return y;
        }
    },
    methods: {
        addTodo() {
            let title = this.newTask.trim();

            if (!this.validateInput(title)) {
                return;
            }

            let startTimestamp = this.startTimestamp
            let endTimestamp = this.endTimestamp
            const startDate = new Date(startTimestamp * 1000);
            const endDate = new Date(endTimestamp * 1000);
            const startStr = `${startDate.getMonth() + 1}/${startDate.getDate()}`;
            const endStr = `${endDate.getMonth() + 1}/${endDate.getDate()}`;
            let formattedDate = `${startStr} - ${endStr}`

            this.updateMinMaxTimestamp(startTimestamp, endTimestamp, true);
            this.clearInputs();

            let todo = {
                title: title,
                complete: false,
                startTimestamp: startTimestamp,
                endTimestamp: endTimestamp,
                formattedDate: formattedDate
            }

            let index = this.todoList.length
            let grid = this.computeGrid(todo, index)
            todo.grid = grid;
            this.todoList.push(todo);
        },
        removeTodo(key) {
            this.todoList.splice(key, 1)
        },
        complete(key) {
            this.todoList[key].complete = !this.todoList[key].complete
            console.log(this.todoList);
            let x = this.todoList.filter(todo => todo.complete != true);
            console.log(x);

        },
        editTodo(key) {
            console.log(key);
            this.editingKey = key;
            console.log('editTodo賦值editingKey:' + this.editingKey);

            this.editedTitle = this.todoList[key].title;
        },
        saveTodo() {
            if (this.editedTitle.trim()) {
                let todo = this.todoList[this.editingKey]
                todo.title = this.editedTitle.trim();
            }

            let startTimestamp = this.editStartTimestamp
            let endTimestamp = this.editEndTimestamp

            if (startTimestamp !== 0 && endTimestamp !== 0) {
                let todo = this.todoList[this.editingKey]
                this.updateMinMaxTimestamp(startTimestamp, endTimestamp);
                todo.startTimestamp = startTimestamp;
                todo.endTimestamp = endTimestamp;

                const startDate = new Date(startTimestamp * 1000);
                const endDate = new Date(endTimestamp * 1000);
                const startStr = `${startDate.getMonth() + 1}/${startDate.getDate()}`;
                const endStr = `${endDate.getMonth() + 1}/${endDate.getDate()}`;
                let formattedDate = `${startStr} - ${endStr}`;
                todo.formattedDate = formattedDate;

                let grid = this.computeGrid(todo, this.editingKey)
                todo.grid = grid;
            }

            this.clearInputs();
        },
        cancelEdit() {
            this.editingKey = null;
            this.editedTitle = '';
        },

        validateInput(title) {
            if (!title) {
                alert('請填寫任務標題');
                return false;
            }
            return true;
        },
        updateMinMaxTimestamp(start, end, newTodo) {
            if (!newTodo) {
                if (start !== 0 && end !== 0) {
                    this.updateMinMax(start, end);
                }
            } else {
                if (start === 0 || end === 0) {
                    alert('請選擇時間區段');
                    return;
                }
                this.updateMinMax(start, end);
            }
        },
        updateMinMax(start, end) {
            if (this.minStartTimestamp > start) {
                this.minStartTimestamp = start;
                console.log('更新最早时间');
            }

            if (this.maxEndTimestamp < end) {
                this.maxEndTimestamp = end;
                console.log('更新最晚时间');
            }
        },
        clearInputs() {
            this.newTask = ""
            this.newdate = '';
            this.startTimestamp = 0;
            this.endTimestamp = 0;
            this.editdate = '';
            this.editStartTimestamp = 0;
            this.editEndTimestamp = 0;
            this.editingKey = null;
        },

        // 對話框
        showDialog() {
            this.$refs.modal.showModal(); // showModal 是 dialog 的原生方法
        },
        closeDialog() {
            this.$refs.modal.close();
        },
        clearAllTasks() {
            this.todoList = []
            this.closeDialog();
        },

        //改變時間起迄點
        newDate(value) {
            if (Array.isArray(value) && value.length === 2) {
                this.startTimestamp = Math.ceil(value[0].getTime() / 1000); // 開始日期的timestamp
                this.endTimestamp = Math.ceil(value[1].getTime() / 1000); // 結束日期的timestamp
            }
        },
        editDate(value) {
            if (Array.isArray(value) && value.length === 2) {
                this.editStartTimestamp = Math.ceil(value[0].getTime() / 1000); // 開始日期的timestamp
                this.editEndTimestamp = Math.ceil(value[1].getTime() / 1000); // 結束日期的timestamp
            }
        },

        computeGrid(todo, key) {
            //間隔幾天
            let diff = Math.abs(Math.ceil((todo.startTimestamp - todo.endTimestamp) / (3600 * 24)));

    

            //start點
            let startDate = new Date(todo.startTimestamp * 1000);
            const dateInfo = {
                year: startDate.getFullYear(),
                month: startDate.getMonth() + 1,
                day: startDate.getDate(),
            }

            // 算出grid
            let grid_row_start = key + 1;
            let grid_column_start = this.dateRange.findIndex(dateObj => this.compareDates(dateObj, dateInfo)) + 1;
            let grid_row_end = grid_row_start + 1;
            let grid_column_end = grid_column_start + diff +1;

            return [grid_row_start, grid_column_start, grid_row_end, grid_column_end]
        },
        compareDates(dateObj1, dateObj2) {
            return (
                dateObj1.year === dateObj2.year &&
                dateObj1.month === dateObj2.month &&
                dateObj1.day === dateObj2.day
            );
        },

        handleWheelScroll(e) {
            if (e.deltaY !== 0) {

                e.preventDefault();
                const scrollContainer = this.$refs.horizontalScroll;
                const scrollAmount = e.deltaY * 1.2; // 平移量

                this.$refs.horizontalScroll.scrollLeft += scrollAmount;
            }

        },
        // prependContent() {
        //     const minDate = new Date(this.minStartTimestamp * 1000);
        //     const dateInfo = {
        //         year: minDate.getFullYear(),
        //         month: minDate.getMonth() + 1,
        //         day: minDate.getDate(),
        //         dayOfWeek: minDate.toLocaleDateString('en-US', { weekday: 'long' }).slice(0, 3),
        //     }

        //     this.dateRange.unshift(dateInfo);
        //     minDate.setDate(minDate.getDate() - 1); // 后一天
        //     this.minStartTimestamp = Math.ceil(minDate.getTime() / 1000);

        // },
        // appendContent() {
        //     const maxDate = new Date(this.maxEndTimestamp * 1000);
        //     const dateInfo = {
        //         year: maxDate.getFullYear(),
        //         month: maxDate.getMonth() + 1,
        //         day: maxDate.getDate(),
        //         dayOfWeek: maxDate.toLocaleDateString('en-US', { weekday: 'long' }).slice(0, 3),
        //     }

        //     this.dateRange.push(dateInfo);
        //     maxDate.setDate(maxDate.getDate() + 1); // 后一天
        //     this.maxEndTimestamp = Math.ceil(maxDate.getTime() / 1000);

        // },
        setInitialPosition() {
            const scrollContainer = this.$refs.horizontalScroll;
            const slider = this.$refs.slider;

            const right = scrollContainer.offsetLeft + scrollContainer.offsetWidth - 220;
            const bottom = scrollContainer.offsetTop + scrollContainer.offsetHeight - 42;

            slider.style.top = `${bottom}px`;
            slider.style.left = `${right}px`;
        },


    },
    watch: {
        dateRange(newValue, oldValue) {
            this.todoList.forEach((todo, index) => {
                let grid = this.computeGrid(todo, index);
                todo.grid = grid;
            });
        },
        width(newValue, oldValue) {
            if (60 <= newValue && newValue < 80) {
                this.dateForm = '2days';
            } else if (40 <= newValue && newValue < 60) {
                this.dateForm = '4days';
            } else if (20 <= newValue && newValue < 40) {
                this.dateForm = 'weeks';
            } else if (10 <= newValue && newValue < 20) {
                this.dateForm = '2weeks';
            } else if (newValue < 10) {
                this.dateForm = 'mouth';
            } else {
                this.dateForm = 'days';
            }
        }

    },
    mounted() {
        const scrollContainer = this.$refs.horizontalScroll;

        this.setInitialPosition();

        scrollContainer.addEventListener('wheel', this.handleWheelScroll);
        window.addEventListener('resize', () => {
            this.setInitialPosition();
            console.log('resize');
        });

        setTimeout(() => {

            let defaltTime = Math.ceil(this.currentDate.getTime() / 1000);
            this.minStartTimestamp = defaltTime;
            this.maxEndTimestamp = defaltTime;

            this.todoList.forEach((todo, index) => {
                todo.grid = this.computeGrid(todo, index);
            });

        }, 100);

    },
    beforeUnmount() {
        const scrollContainer = this.$refs.horizontalScroll;
        scrollContainer.removeEventListener('wheel', this.handleWheelScroll);
        window.removeEventListener('resize', this.handleResize);
    },
})

app.use(ElementPlus);
app.mount("#to-do-list");

