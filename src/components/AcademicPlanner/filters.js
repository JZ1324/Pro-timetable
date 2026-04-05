// Filtering and search helpers for AcademicPlanner

export const getFilteredTasks = (tasks, filters, searchQuery, searchFilters) => {
    let filtered = tasks;
    if (searchQuery) {
        filtered = filtered.filter(task =>
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.type.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    if (searchFilters.title) {
        filtered = filtered.filter(task =>
            task.title.toLowerCase().includes(searchFilters.title.toLowerCase())
        );
    }
    if (searchFilters.subject) {
        filtered = filtered.filter(task =>
            task.subject === searchFilters.subject
        );
    }
    if (searchFilters.type) {
        filtered = filtered.filter(task =>
            task.type === searchFilters.type
        );
    }
    if (searchFilters.priority) {
        filtered = filtered.filter(task => task.priority === searchFilters.priority);
    }
    if (searchFilters.status) {
        filtered = filtered.filter(task => task.status === searchFilters.status);
    }
    if (searchFilters.dateRange.start && searchFilters.dateRange.end) {
        const startDate = new Date(searchFilters.dateRange.start);
        const endDate = new Date(searchFilters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(task => {
            const taskDate = new Date(task.dueDate);
            return taskDate >= startDate && taskDate <= endDate;
        });
    } else if (searchFilters.dateRange.start) {
        const startDate = new Date(searchFilters.dateRange.start);
        filtered = filtered.filter(task => {
            const taskDate = new Date(task.dueDate);
            return taskDate >= startDate;
        });
    } else if (searchFilters.dateRange.end) {
        const endDate = new Date(searchFilters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(task => {
            const taskDate = new Date(task.dueDate);
            return taskDate <= endDate;
        });
    }
    if (searchFilters.tags && searchFilters.tags.length > 0) {
        filtered = filtered.filter(task => {
            if (!task.tags) return false;
            return searchFilters.tags.some(tag => task.tags.includes(tag));
        });
    }
    if (filters.hideCompleted) {
        filtered = filtered.filter(task => task.status !== 'completed');
    }
    if (filters.showOnlyOverdue) {
        const now = new Date();
        filtered = filtered.filter(task => task.status !== 'completed' && new Date(task.dueDate) < now);
    }
    if (filters.showOnlyUpcoming) {
        const now = new Date();
        const twoWeeksFromNow = new Date(now);
        twoWeeksFromNow.setDate(now.getDate() + 14);
        filtered = filtered.filter(task => {
            const dueDate = new Date(task.dueDate);
            return dueDate >= now && dueDate <= twoWeeksFromNow;
        });
    }
    if (filters.subjects.length > 0) {
        filtered = filtered.filter(task => filters.subjects.includes(task.subject));
    }
    if (filters.types.length > 0) {
        filtered = filtered.filter(task => filters.types.includes(task.type));
    }
    if (filters.priorities.length > 0) {
        filtered = filtered.filter(task => filters.priorities.includes(task.priority));
    }
    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
    filtered.sort((a, b) => {
        const priorityA = priorityOrder[a.priority] || 4;
        const priorityB = priorityOrder[b.priority] || 4;
        return priorityA - priorityB;
    });
    return filtered;
};

export const createFilteredTasksSelector = () => {
  let lastArgs = null;
  let lastResult = [];
  return (tasks, filters, searchQuery, searchFilters) => {
    const args = [tasks, filters, searchQuery, searchFilters];
    if (lastArgs && lastArgs[0] === tasks && lastArgs[1] === filters && lastArgs[2] === searchQuery && lastArgs[3] === searchFilters) {
      return lastResult; // shallow memo hit
    }
    const result = getFilteredTasks(tasks, filters, searchQuery, searchFilters);
    lastArgs = args;
    lastResult = result;
    return result;
  };
};

export const shallowEqualTasks = (a, b) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i=0;i<a.length;i++) {
    const ta=a[i], tb=b[i];
    if (ta.id!==tb.id || ta.status!==tb.status || ta.progress!==tb.progress) return false;
  }
  return true;
};
