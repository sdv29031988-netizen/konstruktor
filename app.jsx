const { useEffect, useMemo, useRef, useState } = React;

const STORAGE_KEY = "bilimx-data-v2";
const USER_KEY = "bilimx-user";

const DEMO_COURSES = [
  {
    id: "course-1",
    title: "Основы JavaScript",
    description: "Изучите основы программирования на JavaScript с нуля",
    progress: 75,
    totalLessons: 12,
    completedLessons: 9,
    modules: [
      { id: "m1", title: "Введение", expanded: true, lessons: [
        { id: "l1", title: "Что такое JavaScript", completed: true },
        { id: "l2", title: "Переменные и типы данных", completed: true },
        { id: "l3", title: "Операторы", completed: true },
      ]},
      { id: "m2", title: "Условия и циклы", expanded: false, lessons: [
        { id: "l4", title: "if/else конструкции", completed: true },
        { id: "l5", title: "Цикл for", completed: true },
        { id: "l6", title: "Цикл while", completed: false },
      ]},
      { id: "m3", title: "Функции", expanded: false, lessons: [
        { id: "l7", title: "Создание функций", completed: false },
        { id: "l8", title: "Параметры и аргументы", completed: false },
        { id: "l9", title: "Возвращаемые значения", completed: false },
      ]},
    ],
    lastLessonId: "l6",
    color: "indigo"
  },
  {
    id: "course-2",
    title: "Веб-дизайн для начинающих",
    description: "Создавайте красивые и современные интерфейсы",
    progress: 45,
    totalLessons: 8,
    completedLessons: 4,
    modules: [
      { id: "m1", title: "Основы дизайна", expanded: true, lessons: [
        { id: "l1", title: "Цветовая палитра", completed: true },
        { id: "l2", title: "Типографика", completed: true },
        { id: "l3", title: "Композиция", completed: true },
      ]},
      { id: "m2", title: "Figma", expanded: false, lessons: [
        { id: "l4", title: "Интерфейс Figma", completed: true },
        { id: "l5", title: "Создание макета", completed: false },
      ]},
    ],
    lastLessonId: "l5",
    color: "purple"
  },
  {
    id: "course-3",
    title: "Python для анализа данных",
    description: "Освойте Python и научитесь работать с данными",
    progress: 20,
    totalLessons: 15,
    completedLessons: 3,
    modules: [
      { id: "m1", title: "Python базовый", expanded: true, lessons: [
        { id: "l1", title: "Установка Python", completed: true },
        { id: "l2", title: "Синтаксис", completed: true },
        { id: "l3", title: "Типы данных", completed: true },
        { id: "l4", title: "Списки и словари", completed: false },
      ]},
      { id: "m2", title: "Pandas", expanded: false, lessons: [
        { id: "l5", title: "DataFrame", completed: false },
        { id: "l6", title: "Работа с данными", completed: false },
      ]},
    ],
    lastLessonId: "l4",
    color: "emerald"
  }
];

function loadUser() {
  try {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function loadCourses() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return data.courses || DEMO_COURSES;
    }
  } catch {}
  return DEMO_COURSES;
}

function saveCourses(courses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ courses }));
}

function useHashRouter() {
  const [path, setPath] = useState(() => {
    const hash = window.location.hash.slice(1);
    return hash || '/';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setPath(hash || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (newPath) => {
    window.location.hash = newPath;
  };

  return { path, navigate };
}

function Link({ to, children, className, onClick }) {
  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) onClick();
    window.location.hash = to;
  };

  return React.createElement('a', { href: `#${to}`, onClick: handleClick, className }, children);
}

function IconLogo({ className }) {
  return React.createElement('svg', { viewBox: '0 0 32 32', fill: 'none', className },
    React.createElement('rect', { width: '32', height: '32', rx: '8', fill: 'url(#logoGrad)' }),
    React.createElement('path', { d: 'M10 16L14 12L18 16L22 12', stroke: 'white', strokeWidth: '2.5', strokeLinecap: 'round', strokeLinejoin: 'round' }),
    React.createElement('path', { d: 'M10 20L14 16L18 20L22 16', stroke: 'white', strokeWidth: '2.5', strokeLinecap: 'round', strokeLinejoin: 'round', opacity: '0.7' }),
    React.createElement('defs', null,
      React.createElement('linearGradient', { id: 'logoGrad', x1: '0', y1: '0', x2: '32', y2: '32' },
        React.createElement('stop', { stopColor: '#6366f1' }),
        React.createElement('stop', { offset: '1', stopColor: '#a855f7' })
      )
    )
  );
}

function IconCheck({ className }) {
  return React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', className },
    React.createElement('path', { d: 'M5 12l5 5L20 7', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' })
  );
}

function IconChevron({ className }) {
  return React.createElement('svg', { viewBox: '0 0 24 24', fill: 'none', className },
    React.createElement('path', { d: 'm9 6 6 6-6 6', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' })
  );
}

function Navbar({ user, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Главная' },
    { path: '/courses', label: 'Курсы' },
    { path: '/learning', label: 'Обучение' },
    { path: '/builder', label: 'Конструктор' },
  ];

  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest('.profile-dropdown')) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const currentPath = window.location.hash.slice(1) || '/';

  return React.createElement('nav', { className: 'fixed top-0 left-0 right-0 z-50 glass border-b border-white/30' },
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
      React.createElement('div', { className: 'flex items-center justify-between h-16' },
        React.createElement('div', { className: 'flex items-center gap-8' },
          React.createElement(Link, { to: '/', className: 'flex items-center gap-2' },
            React.createElement(IconLogo, { className: 'w-9 h-9' }),
            React.createElement('span', { className: 'font-display text-xl font-bold gradient-text' }, 'BilimX')
          ),
          React.createElement('div', { className: 'hidden md:flex items-center gap-1' },
            navLinks.map(link =>
              React.createElement(Link, {
                key: link.path,
                to: link.path,
                className: `nav-link px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === link.path ? 'text-indigo-600 active' : 'text-slate-600 hover:text-indigo-600'}`
              }, link.label)
            )
          )
        ),
        React.createElement('div', { className: 'profile-dropdown relative' },
          React.createElement('button', {
            onClick: () => setDropdownOpen(!dropdownOpen),
            className: 'flex items-center gap-3 p-1.5 pr-3 rounded-full glass-light hover:bg-white/80 transition-all'
          },
            React.createElement('div', { className: 'w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-semibold' },
              (user?.name?.charAt(0) || 'U')
            ),
            React.createElement('span', { className: 'hidden sm:block text-sm font-medium text-slate-700' },
              user?.name || 'Пользователь'
            )
          ),
          dropdownOpen && React.createElement('div', { className: 'dropdown-menu absolute right-0 mt-3 w-56 glass border border-white/40 rounded-2xl shadow-xl overflow-hidden' },
            React.createElement('div', { className: 'px-4 py-3 border-b border-slate-200/30' },
              React.createElement('p', { className: 'text-sm font-semibold text-slate-800' }, user?.name || 'Пользователь'),
              React.createElement('p', { className: 'text-xs text-slate-500' }, user?.email || 'user@bilimx.com')
            ),
            React.createElement('div', { className: 'py-2' },
              React.createElement('button', { className: 'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors' }, 'Профиль'),
              React.createElement('button', { className: 'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors' }, 'Настройки')
            ),
            React.createElement('div', { className: 'border-t border-slate-200/30 py-2' },
              React.createElement('button', {
                onClick: () => { onLogout(); },
                className: 'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors'
              }, 'Выйти')
            )
          )
        )
      )
    )
  );
}

function HomePage({ user }) {
  const navigate = (path) => { window.location.hash = path; };

  const features = [
    { icon: '🎨', title: 'Удобный конструктор', desc: 'Создавайте курсы в интуитивном редакторе' },
    { icon: '📊', title: 'Отслеживание прогресса', desc: 'Следите за успехами учеников в реальном времени' },
    { icon: '🚀', title: 'Современный дизайн', desc: 'Красивый интерфейс как у лучших платформ' },
  ];

  return React.createElement('div', { className: 'min-h-screen pt-16' },
    React.createElement('section', { className: 'relative py-20 lg:py-32 overflow-hidden' },
      React.createElement('div', { className: 'hero-glow left-1/2 -translate-x-1/2 -top-20' }),
      React.createElement('div', { className: 'relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
        React.createElement('div', { className: 'text-center max-w-3xl mx-auto' },
          React.createElement('h1', { className: 'font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 animate-fade-in' },
            'Создавай курсы',
            React.createElement('span', { className: 'block gradient-text' }, ' легко и быстро')
          ),
          React.createElement('p', { className: 'text-lg sm:text-xl text-slate-600 mb-10 animate-fade-in stagger-1' },
            'Платформа для создания и проведения онлайн-обучения. Конструктор курсов, отслеживание прогресса и современный интерфейс.'
          ),
          React.createElement('div', { className: 'flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in stagger-2' },
            React.createElement('button', {
              onClick: () => navigate('/learning'),
              className: 'btn-primary px-8 py-4 rounded-2xl text-white font-semibold text-lg'
            }, 'Начать обучение'),
            React.createElement('button', {
              onClick: () => navigate('/builder'),
              className: 'btn-secondary px-8 py-4 rounded-2xl text-slate-700 font-semibold text-lg'
            }, 'Создать курс')
          )
        )
      )
    ),
    React.createElement('section', { className: 'py-16 lg:py-24' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
        React.createElement('h2', { className: 'font-display text-3xl font-bold text-center text-slate-900 mb-12' },
          'Почему выбирают ',
          React.createElement('span', { className: 'gradient-text' }, 'BilimX')
        ),
        React.createElement('div', { className: 'grid md:grid-cols-3 gap-6' },
          features.map((f, i) =>
            React.createElement('div', {
              key: i,
              className: `card-hover glass rounded-3xl p-8 text-center stagger-${i + 1}`,
              style: { animationFillMode: 'both' }
            },
              React.createElement('div', { className: 'text-5xl mb-4' }, f.icon),
              React.createElement('h3', { className: 'font-display text-xl font-semibold text-slate-900 mb-3' }, f.title),
              React.createElement('p', { className: 'text-slate-600' }, f.desc)
            )
          )
        )
      )
    ),
    React.createElement('section', { className: 'py-16 lg:py-24' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
        React.createElement('h2', { className: 'font-display text-3xl font-bold text-center text-slate-900 mb-4' }, 'Конструктор курсов'),
        React.createElement('p', { className: 'text-center text-slate-600 mb-12 max-w-2xl mx-auto' }, 'Мощный и удобный инструмент для создания учебных материалов'),
        React.createElement('div', { className: 'glass rounded-3xl p-6 lg:p-10 border border-slate-200/50' },
          React.createElement('div', { className: 'flex flex-col lg:flex-row gap-8' },
            React.createElement('div', { className: 'flex-1 space-y-4' },
              React.createElement('div', { className: 'h-4 w-3/4 bg-slate-200/50 rounded-lg' }),
              React.createElement('div', { className: 'h-4 w-1/2 bg-slate-200/30 rounded-lg' }),
              React.createElement('div', { className: 'h-4 w-5/6 bg-slate-200/50 rounded-lg' }),
              React.createElement('div', { className: 'flex gap-2 mt-6' },
                React.createElement('div', { className: 'h-8 w-24 rounded-xl bg-indigo-100' }),
                React.createElement('div', { className: 'h-8 w-24 rounded-xl bg-slate-100' })
              )
            ),
            React.createElement('div', { className: 'lg:w-80 h-48 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center' },
              React.createElement('div', { className: 'text-center' },
                React.createElement('span', { className: 'text-indigo-400 font-medium' }, 'Превью')
              )
            )
          )
        )
      )
    ),
    React.createElement('section', { className: 'py-16 lg:py-24' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' },
        React.createElement('div', { className: 'glass gradient-bg rounded-3xl p-10 lg:p-16 text-center text-white' },
          React.createElement('h2', { className: 'font-display text-3xl lg:text-4xl font-bold mb-4' }, 'Готовы начать?'),
          React.createElement('p', { className: 'text-lg text-white/80 mb-8 max-w-xl mx-auto' }, 'Присоединяйтесь к тысячам пользователей, которые уже создают курсы на BilimX'),
          React.createElement('button', {
            onClick: () => navigate('/courses'),
            className: 'px-8 py-4 bg-white text-indigo-600 rounded-2xl font-semibold text-lg hover:scale-105 transition-transform'
          }, 'Начать сейчас')
        )
      )
    ),
    React.createElement('footer', { className: 'py-8 border-t border-slate-200/50' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500' },
        React.createElement('p', null, '© 2025 BilimX. Все права защищены.')
      )
    )
  );
}

function CoursesPage({ courses, onContinue }) {
  const navigate = (path) => { window.location.hash = path; };

  const colorMap = {
    indigo: { from: 'from-indigo-500', to: 'to-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-600' },
    purple: { from: 'from-purple-500', to: 'to-purple-600', bg: 'bg-purple-50', text: 'text-purple-600' },
    emerald: { from: 'from-emerald-500', to: 'to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  };

  return React.createElement('div', { className: 'min-h-screen pt-16' },
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12' },
      React.createElement('div', { className: 'mb-8' },
        React.createElement('h1', { className: 'font-display text-3xl lg:text-4xl font-bold text-slate-900 mb-2' }, 'Мои курсы'),
        React.createElement('p', { className: 'text-slate-600' }, 'Продолжите обучение или начните новый курс')
      ),
      React.createElement('div', { className: 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' },
        courses.map((course, i) => {
          const colors = colorMap[course.color] || colorMap.indigo;
          return React.createElement('div', {
            key: course.id,
            className: `card-hover glass rounded-3xl p-6 border border-slate-200/50 stagger-${i + 1}`,
            style: { animationFillMode: 'both' }
          },
            React.createElement('div', { className: `w-14 h-14 rounded-2xl ${colors.bg} ${colors.text} flex items-center justify-center text-2xl mb-4` }, '📚'),
            React.createElement('h3', { className: 'font-display text-xl font-semibold text-slate-900 mb-2' }, course.title),
            React.createElement('p', { className: 'text-sm text-slate-600 mb-4 line-clamp-2' }, course.description),
            React.createElement('div', { className: 'mb-4' },
              React.createElement('div', { className: 'flex justify-between text-sm mb-2' },
                React.createElement('span', { className: 'text-slate-500' }, 'Прогресс'),
                React.createElement('span', { className: 'font-semibold text-slate-700' }, `${course.progress}%`)
              ),
              React.createElement('div', { className: 'h-2 bg-slate-200 rounded-full overflow-hidden' },
                React.createElement('div', {
                  className: `h-full rounded-full bg-gradient-to-r ${colors.from} ${colors.to} progress-bar`,
                  style: { width: `${course.progress}%` }
                })
              )
            ),
            React.createElement('div', { className: 'flex items-center justify-between' },
              React.createElement('span', { className: 'text-sm text-slate-500' }, `${course.completedLessons}/${course.totalLessons} уроков`),
              React.createElement('button', {
                onClick: () => onContinue(course),
                className: `px-5 py-2.5 rounded-xl font-medium text-sm ${colors.bg} ${colors.text} hover:scale-105 transition-transform`
              }, 'Продолжить')
            )
          );
        })
      )
    )
  );
}

function LearningPage({ courses, onContinue }) {
  const [activeCourse, setActiveCourse] = useState(null);

  const activeCourseData = activeCourse || courses[0];

  const colors = {
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
    emerald: 'from-emerald-500 to-emerald-600',
  };

  if (!activeCourseData) {
    return React.createElement('div', { className: 'min-h-screen pt-16 flex items-center justify-center' },
      React.createElement('p', { className: 'text-slate-500' }, 'Нет доступных курсов')
    );
  }

  const colorClass = colors[activeCourseData.color] || colors.indigo;

  return React.createElement('div', { className: 'min-h-screen pt-16' },
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12' },
      React.createElement('div', { className: 'mb-8' },
        React.createElement('h1', { className: 'font-display text-3xl lg:text-4xl font-bold text-slate-900 mb-2' }, 'Обучение'),
        React.createElement('p', { className: 'text-slate-600' }, 'Продолжите с того места, где остановились')
      ),
      React.createElement('div', { className: 'flex flex-col lg:flex-row gap-8' },
        React.createElement('div', { className: 'lg:w-80 space-y-4' },
          courses.map(course =>
            React.createElement('button', {
              key: course.id,
              onClick: () => setActiveCourse(course),
              className: `w-full p-4 rounded-2xl text-left transition-all ${
                activeCourseData.id === course.id
                  ? 'glass border-indigo-300'
                  : 'glass-light hover:bg-white/80'
              }`
            },
              React.createElement('div', { className: 'flex items-center gap-3' },
                React.createElement('div', { className: `w-10 h-10 rounded-xl bg-gradient-to-br ${colors[course.color] || colors.indigo} flex items-center justify-center text-white text-lg` }, '📚'),
                React.createElement('div', { className: 'min-w-0 flex-1' },
                  React.createElement('p', { className: 'font-medium text-slate-900 truncate' }, course.title),
                  React.createElement('p', { className: 'text-xs text-slate-500' }, `${course.progress}%`)
                )
              )
            )
          )
        ),
        React.createElement('div', { className: 'flex-1' },
          React.createElement('div', { className: 'glass rounded-3xl p-6 lg:p-8' },
            React.createElement('div', { className: 'flex items-center gap-4 mb-6' },
              React.createElement('div', { className: `w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-3xl text-white` }, '📚'),
              React.createElement('div', null,
                React.createElement('h2', { className: 'font-display text-2xl font-bold text-slate-900' }, activeCourseData.title),
                React.createElement('p', { className: 'text-slate-600' }, activeCourseData.description)
              )
            ),
            React.createElement('div', { className: 'mb-6' },
              React.createElement('div', { className: 'flex justify-between text-sm mb-2' },
                React.createElement('span', { className: 'text-slate-500' }, 'Общий прогресс'),
                React.createElement('span', { className: 'font-semibold text-slate-700' }, `${activeCourseData.progress}%`)
              ),
              React.createElement('div', { className: 'h-3 bg-slate-200 rounded-full overflow-hidden' },
                React.createElement('div', {
                  className: `h-full rounded-full bg-gradient-to-r ${colorClass} progress-bar`,
                  style: { width: `${activeCourseData.progress}%` }
                })
              )
            ),
            React.createElement('div', { className: 'space-y-3' },
              activeCourseData.modules.map((module, mi) =>
                React.createElement('div', { key: module.id, className: 'rounded-2xl border border-slate-200/50 overflow-hidden' },
                  React.createElement('div', { className: 'flex items-center justify-between p-4 bg-slate-50/50' },
                    React.createElement('span', { className: 'font-medium text-slate-800' }, `Модуль ${mi + 1}: ${module.title}`),
                    React.createElement('span', { className: 'text-sm text-slate-500' },
                      `${module.lessons.filter(l => l.completed).length}/${module.lessons.length}`
                    )
                  ),
                  React.createElement('div', { className: 'divide-y divide-slate-100' },
                    module.lessons.map((lesson, li) =>
                      React.createElement('button', {
                        key: lesson.id,
                        onClick: () => onContinue(activeCourseData),
                        className: 'w-full flex items-center gap-3 p-4 text-left hover:bg-indigo-50/50 transition-colors'
                      },
                        React.createElement('div', {
                          className: `w-8 h-8 rounded-full flex items-center justify-center ${
                            lesson.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                          }`
                        },
                          lesson.completed
                            ? React.createElement(IconCheck, { className: 'w-4 h-4' })
                            : li + 1
                        ),
                        React.createElement('span', {
                          className: `flex-1 ${lesson.completed ? 'text-slate-600' : 'text-slate-800'}`
                        }, lesson.title),
                        activeCourseData.lastLessonId === lesson.id && !lesson.completed &&
                          React.createElement('span', { className: 'px-2 py-1 bg-indigo-100 text-indigo-600 text-xs rounded-lg' }, 'Текущий')
                      )
                    )
                  )
                )
              )
            ),
            React.createElement('button', {
              onClick: () => onContinue(activeCourseData),
              className: 'mt-6 w-full btn-primary py-4 rounded-2xl text-white font-semibold'
            }, 'Продолжить обучение')
          )
        )
      )
    )
  );
}

function BuilderPage() {
  const [state, setState] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const selectedContext = useMemo(() => {
    if (!state) return null;
    for (let mi = 0; mi < state.modules.length; mi++) {
      for (let li = 0; li < state.modules[mi].lessons.length; li++) {
        if (state.modules[mi].lessons[li].id === state.selectedLessonId) {
          return { module: state.modules[mi], lesson: state.modules[mi].lessons[li], mi, li };
        }
      }
    }
    return null;
  }, [state]);

  const overallProgress = useMemo(() => {
    if (!state) return { total: 0, completed: 0, percent: 0 };
    const all = state.modules.flatMap(m => m.lessons);
    const completed = all.filter(l => l.completed).length;
    return { total: all.length, completed, percent: all.length ? Math.round((completed / all.length) * 100) : 0 };
  }, [state]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let builder = null;
    try {
      if (saved) {
        const data = JSON.parse(saved);
        builder = data.builder;
      }
    } catch {}

    if (!builder) {
      builder = {
        modules: [
          { id: 'm1', title: 'Модуль 1', expanded: true, lessons: [
            { id: 'l1-1', title: 'Введение', completed: true, blocks: [{ id: 'b1', type: 'heading', value: 'Введение' }, { id: 'b2', type: 'text', value: 'Добро пожаловать в курс!' }] },
            { id: 'l1-2', title: 'Основы', completed: true, blocks: [{ id: 'b3', type: 'heading', value: 'Основы' }, { id: 'b4', type: 'text', value: 'Базовые понятия' }] },
            { id: 'l1-3', title: 'Практика', completed: false, blocks: [{ id: 'b5', type: 'heading', value: 'Практика' }, { id: 'b6', type: 'text', value: 'Практические задания' }] },
          ]},
          { id: 'm2', title: 'Модуль 2', expanded: true, lessons: [
            { id: 'l2-1', title: 'Продвинутые темы', completed: false, blocks: [{ id: 'b7', type: 'heading', value: 'Продвинутые темы' }, { id: 'b8', type: 'text', value: 'Сложные концепции' }] },
            { id: 'l2-2', title: 'Проект', completed: false, blocks: [{ id: 'b9', type: 'heading', value: 'Проект' }, { id: 'b10', type: 'text', value: 'Итоговый проект курса' }] },
          ]},
        ],
        selectedLessonId: 'l2-2',
      };
    }
    setState(builder);
  }, []);

  useEffect(() => {
    if (state) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const data = saved ? JSON.parse(saved) : {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, builder: state }));
      } catch {}
    }
  }, [state]);

  function selectLesson(id) {
    setState(prev => ({ ...prev, selectedLessonId: id }));
    setMobileSidebarOpen(false);
  }

  function toggleModule(id) {
    setState(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === id ? { ...m, expanded: !m.expanded } : m)
    }));
  }

  function addModule() {
    const num = state.modules.length + 1;
    const newLesson = { id: `l${num}-1`, title: `Урок ${num}-1`, completed: false, blocks: [] };
    setState(prev => ({
      ...prev,
      modules: [...prev.modules, { id: `m${num}`, title: `Модуль ${num}`, expanded: true, lessons: [newLesson] }],
      selectedLessonId: newLesson.id
    }));
  }

  function deleteModule(id) {
    if (state.modules.length <= 1) return;
    setState(prev => ({ ...prev, modules: prev.modules.filter(m => m.id !== id) }));
  }

  function addLesson(moduleId) {
    const module = state.modules.find(m => m.id === moduleId);
    const num = module.lessons.length + 1;
    const newId = `${moduleId}-${num}`;
    const newLesson = { id: newId, title: `Урок ${module.lessons.length + 1}`, completed: false, blocks: [] };
    setState(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m),
      selectedLessonId: newId
    }));
  }

  function deleteLesson(moduleId, lessonId) {
    setState(prev => {
      const all = prev.modules.flatMap(m => m.lessons);
      if (all.length <= 1) return prev;
      return {
        ...prev,
        modules: prev.modules.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m),
        selectedLessonId: prev.selectedLessonId === lessonId ? all.find(l => l.id !== lessonId)?.id : prev.selectedLessonId
      };
    });
  }

  function toggleComplete(moduleId, lessonId) {
    setState(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, completed: !l.completed } : l) } : m)
    }));
  }

  function updateLessonTitle(moduleId, lessonId, title) {
    setState(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, title } : l) } : m)
    }));
  }

  function addBlock(moduleId, lessonId, type) {
    const newBlock = { id: `b${Date.now()}`, type, value: '' };
    setState(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, blocks: [...l.blocks, newBlock] } : l) } : m)
    }));
  }

  function deleteBlock(moduleId, lessonId, blockId) {
    setState(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, blocks: l.blocks.filter(b => b.id !== blockId) } : l) } : m)
    }));
  }

  function updateBlock(moduleId, lessonId, blockId, value) {
    setState(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, blocks: l.blocks.map(b => b.id === blockId ? { ...b, value } : b) } : l) } : m)
    }));
  }

  if (!state) return null;

  const selectedModule = selectedContext?.module;
  const selectedLesson = selectedContext?.lesson;

  return React.createElement('div', { className: 'fixed inset-0 top-16 bg-slate-50/50' },
    React.createElement('div', { className: 'h-full flex' },
      React.createElement('aside', {
        className: `fixed inset-y-0 left-0 z-40 w-[85%] max-w-sm border-r border-slate-200/50 bg-white/95 backdrop-blur transition-transform md:static md:z-10 md:w-72 md:max-w-none ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
      },
        React.createElement('div', { className: 'h-full flex flex-col' },
          React.createElement('div', { className: 'p-4 border-b border-slate-200/50' },
            React.createElement('p', { className: 'text-xs font-medium uppercase tracking-wider text-slate-400 mb-3' }, 'Структура курса'),
            React.createElement('button', { onClick: addModule, className: 'w-full btn-primary py-2.5 rounded-xl text-sm font-medium' }, '+ Добавить модуль')
          ),
          React.createElement('div', { className: 'flex-1 overflow-y-auto p-3 space-y-2' },
            state.modules.map((module, mi) => {
              const done = module.lessons.filter(l => l.completed).length;
              const percent = module.lessons.length ? Math.round(done / module.lessons.length * 100) : 0;
              return React.createElement('div', { key: module.id, className: 'rounded-2xl border border-slate-200/50 bg-white/80 p-2' },
                React.createElement('div', { className: 'flex items-center gap-2' },
                  React.createElement('button', {
                    onClick: () => toggleModule(module.id),
                    className: 'p-1.5 rounded-lg hover:bg-slate-100'
                  },
                    React.createElement(IconChevron, { className: `w-4 h-4 text-slate-400 transition-transform ${module.expanded ? 'rotate-90' : ''}` })
                  ),
                  React.createElement('button', {
                    onClick: () => selectLesson(module.lessons[0]?.id),
                    className: 'flex-1 text-left'
                  },
                    React.createElement('p', { className: 'font-medium text-slate-800 text-sm' }, module.title),
                    React.createElement('p', { className: 'text-xs text-slate-500' }, `${done}/${module.lessons.length}`)
                  ),
                  React.createElement('button', { onClick: () => addLesson(module.id), className: 'p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600' }, '+'),
                  React.createElement('button', { onClick: () => deleteModule(module.id), className: 'p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600' }, '×')
                ),
                React.createElement('div', { className: 'h-1 mt-2 rounded-full bg-slate-100' },
                  React.createElement('div', { className: 'h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500', style: { width: `${percent}%` } })
                ),
                module.expanded && React.createElement('div', { className: 'mt-2 space-y-1 pl-2' },
                  module.lessons.map(lesson =>
                    React.createElement('div', {
                      key: lesson.id,
                      className: `flex items-center gap-1 p-2 rounded-lg cursor-pointer ${state.selectedLessonId === lesson.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'}`
                    },
                      React.createElement('button', {
                        onClick: () => selectLesson(lesson.id),
                        className: 'flex-1 flex items-center gap-2 text-left'
                      },
                        React.createElement('span', { className: `w-2 h-2 rounded-full ${lesson.completed ? 'bg-emerald-500' : 'bg-slate-300'}` }),
                        React.createElement('span', { className: 'text-sm text-slate-700 truncate' }, lesson.title)
                      ),
                      React.createElement('button', {
                        onClick: () => toggleComplete(module.id, lesson.id),
                        className: `p-1 rounded ${lesson.completed ? 'text-emerald-600' : 'text-slate-300 hover:text-emerald-600'}`
                      }, '✓'),
                      React.createElement('button', {
                        onClick: () => deleteLesson(module.id, lesson.id),
                        className: 'p-1 rounded text-slate-300 hover:text-rose-600'
                      }, '×')
                    )
                  )
                )
              );
            })
          )
        )
      ),
      mobileSidebarOpen && React.createElement('button', {
        className: 'fixed inset-0 z-30 bg-black/20 md:hidden',
        onClick: () => setMobileSidebarOpen(false)
      }),
      React.createElement('div', { className: 'flex-1 flex flex-col overflow-hidden' },
        React.createElement('header', { className: 'h-16 border-b border-slate-200/50 bg-white/80 backdrop-blur flex items-center justify-between px-6' },
          React.createElement('div', { className: 'flex items-center gap-4' },
            React.createElement('button', {
              onClick: () => setMobileSidebarOpen(true),
              className: 'md:hidden p-2 rounded-lg hover:bg-slate-100'
            }, '☰'),
            React.createElement('div', null,
              React.createElement('p', { className: 'text-xs text-slate-400' }, 'BilimX'),
              React.createElement('p', { className: 'font-semibold text-slate-800' }, 'Конструктор курсов')
            )
          ),
          React.createElement('div', { className: 'flex items-center gap-4' },
            React.createElement('span', { className: 'text-sm text-slate-500' }, `Прогресс: ${overallProgress.completed}/${overallProgress.total}`),
            React.createElement('div', { className: 'w-32 h-2 rounded-full bg-slate-100 overflow-hidden' },
              React.createElement('div', {
                className: 'h-full bg-gradient-to-r from-indigo-400 to-purple-500 progress-bar',
                style: { width: `${overallProgress.percent}%` }
              })
            )
          )
        ),
        React.createElement('main', { className: 'flex-1 overflow-y-auto p-6' },
          selectedLesson ? React.createElement('div', { key: selectedLesson.id, className: 'max-w-3xl mx-auto animate-fade-in' },
            React.createElement('div', { className: 'glass rounded-3xl p-6 mb-6' },
              React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                React.createElement('span', { className: 'text-sm text-slate-500' }, `${selectedModule.title} / ${selectedLesson.title}`),
                React.createElement('button', {
                  onClick: () => toggleComplete(selectedModule.id, selectedLesson.id),
                  className: `px-4 py-2 rounded-xl text-sm font-medium ${selectedLesson.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-600'}`
                }, selectedLesson.completed ? '✓ Пройдено' : 'Отметить')
              ),
              React.createElement('input', {
                value: selectedLesson.title,
                onChange: e => updateLessonTitle(selectedModule.id, selectedLesson.id, e.target.value),
                className: 'w-full text-2xl font-display font-bold text-slate-900 bg-transparent border-none outline-none'
              })
            ),
            React.createElement('div', { className: 'glass rounded-3xl p-6' },
              React.createElement('div', { className: 'flex gap-2 mb-4' },
                React.createElement('button', {
                  onClick: () => addBlock(selectedModule.id, selectedLesson.id, 'heading'),
                  className: 'px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium hover:border-indigo-300'
                }, '+ Заголовок'),
                React.createElement('button', {
                  onClick: () => addBlock(selectedModule.id, selectedLesson.id, 'text'),
                  className: 'px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium hover:border-indigo-300'
                }, '+ Текст'),
                React.createElement('button', {
                  onClick: () => addBlock(selectedModule.id, selectedLesson.id, 'block'),
                  className: 'px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium hover:border-indigo-300'
                }, '+ Блок')
              ),
              React.createElement('div', { className: 'space-y-4' },
                selectedLesson.blocks.map(block =>
                  React.createElement('div', { key: block.id, className: 'relative group' },
                    React.createElement('button', {
                      onClick: () => deleteBlock(selectedModule.id, selectedLesson.id, block.id),
                      className: 'absolute -right-2 -top-2 w-6 h-6 rounded-full bg-rose-100 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'
                    }, '×'),
                    block.type === 'heading'
                      ? React.createElement('input', {
                          value: block.value,
                          onChange: e => updateBlock(selectedModule.id, selectedLesson.id, block.id, e.target.value),
                          className: 'w-full text-xl font-semibold text-slate-900 bg-transparent border-none outline-none p-2 rounded-lg hover:bg-slate-50',
                          placeholder: 'Заголовок...'
                        })
                      : React.createElement('textarea', {
                          value: block.value,
                          onChange: e => updateBlock(selectedModule.id, selectedLesson.id, block.id, e.target.value),
                          className: 'w-full text-slate-700 bg-transparent border-none outline-none p-2 rounded-lg hover:bg-slate-50 resize-none',
                          rows: block.type === 'block' ? 3 : 4,
                          placeholder: block.type === 'block' ? 'Блок с информацией...' : 'Текст урока...'
                        })
                  )
                )
              )
            )
          ) : React.createElement('div', { className: 'text-center py-20' },
            React.createElement('p', { className: 'text-slate-500' }, 'Выберите урок для редактирования')
          )
        )
      )
    )
  );
}

function App() {
  const [user, setUser] = useState(() => loadUser());
  const [courses, setCourses] = useState(() => loadCourses());
  const { path } = useHashRouter();

  useEffect(() => {
    if (!user) {
      const newUser = { name: 'Александр', email: 'alex@bilimx.com' };
      saveUser(newUser);
      setUser(newUser);
    }
  }, []);

  useEffect(() => {
    saveCourses(courses);
  }, [courses]);

  function handleLogout() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    window.location.hash = '/';
    window.location.reload();
  }

  function handleContinue(course) {
    window.location.hash = '/builder';
  }

  let content;
  switch (path) {
    case '/courses':
      content = React.createElement(CoursesPage, { courses, onContinue: handleContinue });
      break;
    case '/learning':
      content = React.createElement(LearningPage, { courses, onContinue: handleContinue });
      break;
    case '/builder':
      content = React.createElement(BuilderPage);
      break;
    default:
      content = React.createElement(HomePage, { user });
  }

  return React.createElement('div', { className: 'min-h-screen bg-app' },
    React.createElement(Navbar, { user, onLogout: handleLogout }),
    content
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));