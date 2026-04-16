const { useEffect, useMemo, useRef, useState } = React;

const STORAGE_KEY = "bilimx-course-builder-v1";

const BLOCK_META = {
  heading: {
    label: "Заголовок",
    placeholder: "Введите заголовок секции...",
  },
  text: {
    label: "Текст",
    placeholder: "Опишите содержание урока, ключевые идеи и структуру.",
  },
  block: {
    label: "Блок",
    placeholder: "Добавьте полезный блок: чек-лист, тезисы, задание.",
  },
};

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now()
    .toString(36)
    .slice(-4)}`;
}

function createBlock(type, value = "") {
  return {
    id: createId("block"),
    type,
    value,
  };
}

function createLesson(moduleNumber, lessonNumber, titleOverride) {
  const title = titleOverride || `Урок ${moduleNumber}-${lessonNumber}`;

  return {
    id: createId("lesson"),
    title,
    completed: false,
    blocks: [
      createBlock("heading", title),
      createBlock(
        "text",
        "Кратко опишите цель урока и результат, который студент должен получить."
      ),
    ],
  };
}

function createInitialState() {
  const modules = Array.from({ length: 3 }, (_, moduleIndex) => {
    const moduleNumber = moduleIndex + 1;
    const lessons = Array.from({ length: 4 }, (_, lessonIndex) => {
      const lessonNumber = lessonIndex + 1;
      return {
        id: `lesson-${moduleNumber}-${lessonNumber}`,
        title: `Урок ${moduleNumber}-${lessonNumber}`,
        completed: false,
        blocks: [
          createBlock("heading", `Урок ${moduleNumber}-${lessonNumber}`),
          createBlock(
            "text",
            "Добавьте здесь план, материалы и практику для этого урока."
          ),
        ],
      };
    });

    return {
      id: `module-${moduleNumber}`,
      title: `Модуль ${moduleNumber}`,
      expanded: true,
      lessons,
    };
  });

  return {
    modules,
    selectedLessonId: "lesson-2-2",
  };
}

function sanitizeState(rawState) {
  const fallback = createInitialState();

  if (!rawState || !Array.isArray(rawState.modules)) {
    return fallback;
  }

  const modules = rawState.modules
    .filter((moduleItem) => moduleItem && typeof moduleItem === "object")
    .map((moduleItem, moduleIndex) => {
      const moduleNumber = moduleIndex + 1;
      const lessonsInput = Array.isArray(moduleItem.lessons)
        ? moduleItem.lessons
        : [];

      const lessons =
        lessonsInput.length > 0
          ? lessonsInput
              .filter((lessonItem) => lessonItem && typeof lessonItem === "object")
              .map((lessonItem, lessonIndex) => {
                const lessonNumber = lessonIndex + 1;
                const blocksInput = Array.isArray(lessonItem.blocks)
                  ? lessonItem.blocks
                  : [];

                const blocks =
                  blocksInput.length > 0
                    ? blocksInput
                        .filter((blockItem) => blockItem && typeof blockItem === "object")
                        .map((blockItem) => {
                          const type = Object.prototype.hasOwnProperty.call(
                            BLOCK_META,
                            blockItem.type
                          )
                            ? blockItem.type
                            : "text";
                          return {
                            id: blockItem.id || createId("block"),
                            type,
                            value: typeof blockItem.value === "string" ? blockItem.value : "",
                          };
                        })
                    : [createBlock("text", "")];

                return {
                  id: lessonItem.id || createId("lesson"),
                  title:
                    typeof lessonItem.title === "string" && lessonItem.title.trim()
                      ? lessonItem.title
                      : `Урок ${moduleNumber}-${lessonNumber}`,
                  completed: Boolean(lessonItem.completed),
                  blocks,
                };
              })
          : [createLesson(moduleNumber, 1)];

      return {
        id: moduleItem.id || createId("module"),
        title:
          typeof moduleItem.title === "string" && moduleItem.title.trim()
            ? moduleItem.title
            : `Модуль ${moduleNumber}`,
        expanded: moduleItem.expanded !== false,
        lessons,
      };
    });

  if (modules.length === 0) {
    return fallback;
  }

  return ensureSelectedState({
    modules,
    selectedLessonId: rawState.selectedLessonId,
  });
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return createInitialState();
    }

    const parsed = JSON.parse(saved);
    return sanitizeState(parsed);
  } catch (error) {
    return createInitialState();
  }
}

function ensureSelectedState(state) {
  const firstLessonId =
    state.modules.flatMap((module) => module.lessons).find((lesson) => lesson?.id)?.id || null;
  const context = findLessonContext(state.modules, state.selectedLessonId);

  if (context) {
    return state;
  }

  return {
    ...state,
    selectedLessonId: firstLessonId,
  };
}

function findLessonContext(modules, lessonId) {
  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex += 1) {
    const module = modules[moduleIndex];
    for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex += 1) {
      const lesson = module.lessons[lessonIndex];
      if (lesson.id === lessonId) {
        return {
          module,
          moduleIndex,
          lesson,
          lessonIndex,
        };
      }
    }
  }

  return null;
}

function moveLesson(modules, sourceModuleId, lessonId, targetModuleId, targetLessonId) {
  if (!sourceModuleId || !lessonId || !targetModuleId) {
    return modules;
  }

  if (sourceModuleId === targetModuleId && lessonId === targetLessonId) {
    return modules;
  }

  const nextModules = modules.map((module) => ({
    ...module,
    lessons: [...module.lessons],
  }));

  const sourceModule = nextModules.find((module) => module.id === sourceModuleId);
  const targetModule = nextModules.find((module) => module.id === targetModuleId);

  if (!sourceModule || !targetModule) {
    return modules;
  }

  const sourceIndex = sourceModule.lessons.findIndex((lesson) => lesson.id === lessonId);
  if (sourceIndex === -1) {
    return modules;
  }

  const [movedLesson] = sourceModule.lessons.splice(sourceIndex, 1);
  if (!movedLesson) {
    return modules;
  }

  if (!targetLessonId) {
    targetModule.lessons.push(movedLesson);
    return nextModules;
  }

  let targetIndex = targetModule.lessons.findIndex(
    (lesson) => lesson.id === targetLessonId
  );

  if (targetIndex === -1) {
    targetModule.lessons.push(movedLesson);
    return nextModules;
  }

  if (sourceModuleId === targetModuleId && sourceIndex < targetIndex) {
    targetIndex -= 1;
  }

  targetModule.lessons.splice(targetIndex, 0, movedLesson);
  return nextModules;
}

function IconMenu({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 7h16M4 12h16M4 17h10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChevron({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlus({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCheck({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="m5.5 12.5 4.1 4.1 8.9-9.2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTrash({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 7h16m-2 0-.7 11.3a2 2 0 0 1-2 1.7H8.7a2 2 0 0 1-2-1.7L6 7m3-3h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Header({
  selectedModule,
  selectedLessonId,
  overallProgress,
  onOpenSidebar,
  onSelectStep,
}) {
  const steps = selectedModule ? selectedModule.lessons : [];

  return (
    <header className="border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur md:px-8 md:py-5">
      <div className="grid items-center gap-3 lg:grid-cols-[auto,1fr,auto]">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:scale-105 hover:border-brand-300 hover:text-brand-600 md:hidden"
            aria-label="Открыть меню"
          >
            <IconMenu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-slate-400">
              Learning Studio
            </p>
            <h1 className="font-display text-2xl font-semibold text-slate-900">BilimX</h1>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="font-medium">Шаги урока</span>
            <span>
              {selectedModule ? `${selectedModule.title} · ${steps.length} уроков` : "Нет уроков"}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {steps.map((lesson, index) => {
              const isCurrent = lesson.id === selectedLessonId;
              const isCompleted = lesson.completed;

              let stepClasses =
                "border-slate-300 bg-white text-slate-500 hover:border-slate-400";

              if (isCompleted) {
                stepClasses =
                  "border-brand-500 bg-brand-500 text-white hover:border-brand-500";
              } else if (isCurrent) {
                stepClasses =
                  "active-step-ring border-brand-500 bg-brand-50 text-brand-700 hover:border-brand-500";
              }

              return (
                <button
                  key={lesson.id}
                  onClick={() => onSelectStep(lesson.id)}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-200 ${stepClasses}`}
                  title={lesson.title}
                >
                  {isCompleted ? <IconCheck className="h-4 w-4" /> : index + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
              style={{ width: `${overallProgress.percent}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-right shadow-sm">
          <p className="text-sm font-semibold text-slate-800">Конструктор</p>
          <p className="text-sm text-slate-500">
            Прогресс курса {overallProgress.completed}/{overallProgress.total}
          </p>
        </div>
      </div>
    </header>
  );
}

function Sidebar({
  modules,
  selectedLessonId,
  mobileOpen,
  onCloseMobile,
  onToggleModule,
  onSelectLesson,
  onAddModule,
  onDeleteModule,
  onAddLesson,
  onDeleteLesson,
  onToggleLessonComplete,
  onLessonDragStart,
  onLessonDrop,
  onModuleDrop,
  onDragEnd,
}) {
  return (
    <>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-[1px] md:hidden"
          onClick={onCloseMobile}
          aria-label="Закрыть панель"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[88%] max-w-[340px] border-r border-slate-200/90 bg-white/95 transition-transform duration-300 md:static md:z-10 md:w-[320px] md:max-w-none md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200/90 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              Структура курса
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={onAddModule}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] hover:bg-brand-700"
              >
                <IconPlus className="h-4 w-4" />
                Добавить модуль
              </button>
            </div>
          </div>

          <div className="sidebar-scroll flex-1 overflow-y-auto p-3">
            {modules.map((module) => {
              const doneCount = module.lessons.filter((lesson) => lesson.completed).length;
              const modulePercent = module.lessons.length
                ? Math.round((doneCount / module.lessons.length) * 100)
                : 0;

              return (
                <article
                  key={module.id}
                  className="mb-3 rounded-2xl border border-slate-200/90 bg-white/90 p-2 shadow-sm transition-all duration-200 hover:shadow-md"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    onModuleDrop(module.id);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleModule(module.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-600"
                      aria-label="Раскрыть модуль"
                    >
                      <IconChevron
                        className={`h-4 w-4 transition-transform duration-200 ${
                          module.expanded ? "rotate-90" : "rotate-0"
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => module.lessons[0] && onSelectLesson(module.lessons[0].id)}
                      className="min-w-0 flex-1 rounded-xl px-1 py-1 text-left"
                    >
                      <p className="truncate text-sm font-semibold text-slate-800">{module.title}</p>
                      <p className="truncate text-xs text-slate-500">
                        {doneCount}/{module.lessons.length} завершено
                      </p>
                    </button>

                    <button
                      onClick={() => onAddLesson(module.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-600"
                      aria-label="Добавить урок"
                    >
                      <IconPlus className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => onDeleteModule(module.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-rose-300 hover:text-rose-600"
                      aria-label="Удалить модуль"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/90">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-300 to-brand-500 transition-all duration-500"
                      style={{ width: `${modulePercent}%` }}
                    />
                  </div>

                  <div
                    className={`grid overflow-hidden transition-all duration-300 ${
                      module.expanded
                        ? "mt-2 grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="space-y-1 overflow-hidden pb-1">
                      {module.lessons.map((lesson) => {
                        const isActive = selectedLessonId === lesson.id;

                        return (
                          <div
                            key={lesson.id}
                            className={`group flex items-center gap-1 rounded-xl border px-1 transition-all duration-200 ${
                              isActive
                                ? "border-brand-300 bg-brand-50"
                                : "border-transparent bg-white hover:border-slate-200"
                            }`}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              onLessonDrop(module.id, lesson.id);
                            }}
                          >
                            <button
                              draggable
                              onDragStart={(event) =>
                                onLessonDragStart(event, module.id, lesson.id)
                              }
                              onDragEnd={onDragEnd}
                              onClick={() => onSelectLesson(lesson.id)}
                              className="flex min-w-0 flex-1 cursor-grab items-center gap-2 rounded-lg px-2 py-2 text-left active:cursor-grabbing"
                              title="Перетащите, чтобы изменить порядок"
                            >
                              <span
                                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                  lesson.completed ? "bg-emerald-500" : "bg-slate-300"
                                }`}
                              />
                              <span className="truncate text-sm text-slate-700">{lesson.title}</span>
                            </button>

                            <button
                              onClick={() => onToggleLessonComplete(module.id, lesson.id)}
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                                lesson.completed
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                                  : "border-slate-200 bg-white text-slate-400 hover:border-emerald-300 hover:text-emerald-600"
                              }`}
                              aria-label="Отметить урок"
                            >
                              <IconCheck className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => onDeleteLesson(module.id, lesson.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-rose-300 hover:text-rose-600"
                              aria-label="Удалить урок"
                            >
                              <IconTrash className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}

                      {module.lessons.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-300 px-3 py-3 text-xs text-slate-500">
                          Пустой модуль. Добавьте урок или перетащите сюда существующий.
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}

function LessonView({
  selectedModule,
  selectedLesson,
  onUpdateLessonTitle,
  onToggleLessonComplete,
  onAddBlock,
  onDeleteBlock,
  onUpdateBlock,
}) {
  if (!selectedLesson || !selectedModule) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200/80 bg-white/80 p-8 text-center shadow-sm">
        <p className="font-display text-xl text-slate-700">Урок не выбран</p>
        <p className="mt-2 text-slate-500">Выберите урок в левой панели, чтобы начать редактирование.</p>
      </div>
    );
  }

  return (
    <div key={selectedLesson.id} className="lesson-animate mx-auto max-w-5xl space-y-5">
      <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-slate-500">
            <span className="font-medium text-slate-700">{selectedModule.title}</span>
            <span className="mx-2 text-slate-300">/</span>
            <span>{selectedLesson.title}</span>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            Автосохранение включено
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-[230px] flex-1">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Название урока
            </span>
            <input
              value={selectedLesson.title}
              onChange={(event) => onUpdateLessonTitle(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-800 outline-none transition-all duration-200 focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
              placeholder="Введите название урока"
            />
          </label>

          <button
            onClick={onToggleLessonComplete}
            className={`inline-flex h-[50px] items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition-all duration-200 hover:scale-[1.01] ${
              selectedLesson.completed
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-brand-300 bg-brand-50 text-brand-700 hover:border-brand-400"
            }`}
          >
            <IconCheck className="h-4 w-4" />
            {selectedLesson.completed ? "Отмечено как пройдено" : "Отметить как пройдено"}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm">
        <div className="border-b border-slate-200/80 px-5 py-4 md:px-7">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onAddBlock("heading")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:scale-[1.01] hover:border-brand-300 hover:text-brand-700"
            >
              <IconPlus className="h-4 w-4" />
              Заголовок
            </button>
            <button
              onClick={() => onAddBlock("text")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:scale-[1.01] hover:border-brand-300 hover:text-brand-700"
            >
              <IconPlus className="h-4 w-4" />
              Текст
            </button>
            <button
              onClick={() => onAddBlock("block")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:scale-[1.01] hover:border-brand-300 hover:text-brand-700"
            >
              <IconPlus className="h-4 w-4" />
              Блок
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 md:px-7 md:py-6">
          {selectedLesson.blocks.map((block) => {
            const meta = BLOCK_META[block.type] || BLOCK_META.text;
            const areaClassByType =
              block.type === "heading"
                ? "text-2xl font-display font-semibold leading-tight"
                : "text-base font-normal";
            const wrapperClassByType =
              block.type === "block"
                ? "border-brand-200 bg-brand-50/70"
                : "border-slate-200 bg-white";

            return (
              <article
                key={block.id}
                className={`rounded-2xl border p-4 transition-all duration-200 hover:border-brand-200 ${wrapperClassByType}`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {meta.label}
                  </p>
                  <button
                    onClick={() => onDeleteBlock(block.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-rose-300 hover:text-rose-600"
                    aria-label="Удалить блок"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>

                {block.type === "heading" ? (
                  <input
                    value={block.value}
                    onChange={(event) => onUpdateBlock(block.id, event.target.value)}
                    placeholder={meta.placeholder}
                    className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition-all duration-200 focus:border-brand-300 focus:ring-4 focus:ring-brand-100 ${areaClassByType}`}
                  />
                ) : (
                  <textarea
                    rows={block.type === "text" ? 5 : 4}
                    value={block.value}
                    onChange={(event) => onUpdateBlock(block.id, event.target.value)}
                    placeholder={meta.placeholder}
                    className={`w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition-all duration-200 focus:border-brand-300 focus:ring-4 focus:ring-brand-100 ${areaClassByType}`}
                  />
                )}
              </article>
            );
          })}

          {selectedLesson.blocks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
              Добавьте первый блок, чтобы начать наполнение урока.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function App() {
  const [state, setState] = useState(() => loadState());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const dragStateRef = useRef(null);

  const selectedContext = useMemo(
    () => findLessonContext(state.modules, state.selectedLessonId),
    [state.modules, state.selectedLessonId]
  );

  const selectedModule = selectedContext?.module || null;
  const selectedLesson = selectedContext?.lesson || null;

  const overallProgress = useMemo(() => {
    const allLessons = state.modules.flatMap((module) => module.lessons);
    const total = allLessons.length;
    const completed = allLessons.filter((lesson) => lesson.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [state.modules]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  useEffect(() => {
    if (!selectedContext) {
      setState((prev) => ensureSelectedState(prev));
    }
  }, [selectedContext]);

  function updateState(recipe) {
    setState((prev) => ensureSelectedState(recipe(prev)));
  }

  function selectLesson(lessonId) {
    setState((prev) => ({
      ...prev,
      selectedLessonId: lessonId,
    }));
    setMobileSidebarOpen(false);
  }

  function handleToggleModule(moduleId) {
    updateState((prev) => ({
      ...prev,
      modules: prev.modules.map((module) =>
        module.id === moduleId ? { ...module, expanded: !module.expanded } : module
      ),
    }));
  }

  function handleAddModule() {
    updateState((prev) => {
      const moduleNumber = prev.modules.length + 1;
      const firstLesson = createLesson(moduleNumber, 1);
      const newModule = {
        id: createId("module"),
        title: `Модуль ${moduleNumber}`,
        expanded: true,
        lessons: [firstLesson],
      };

      return {
        ...prev,
        modules: [...prev.modules, newModule],
        selectedLessonId: firstLesson.id,
      };
    });
  }

  function handleDeleteModule(moduleId) {
    updateState((prev) => {
      if (prev.modules.length <= 1) {
        return prev;
      }

      const modules = prev.modules.filter((module) => module.id !== moduleId);
      const lessonsLeft = modules.reduce((sum, module) => sum + module.lessons.length, 0);

      if (lessonsLeft === 0 && modules[0]) {
        modules[0] = {
          ...modules[0],
          expanded: true,
          lessons: [createLesson(1, 1)],
        };
      }

      return {
        ...prev,
        modules,
      };
    });
  }

  function handleAddLesson(moduleId) {
    updateState((prev) => {
      let newLessonId = prev.selectedLessonId;
      const modules = prev.modules.map((module) => {
        if (module.id !== moduleId) {
          return module;
        }

        const lesson = createLesson(moduleIndex + 1, module.lessons.length + 1);
        newLessonId = lesson.id;
        return {
          ...module,
          expanded: true,
          lessons: [...module.lessons, lesson],
        };
      });

      return {
        ...prev,
        modules,
        selectedLessonId: newLessonId,
      };
    });
  }

  function handleDeleteLesson(moduleId, lessonId) {
    updateState((prev) => {
      const totalLessons = prev.modules.reduce(
        (sum, module) => sum + module.lessons.length,
        0
      );

      if (totalLessons <= 1) {
        return prev;
      }

      const currentOrder = prev.modules.flatMap((module) =>
        module.lessons.map((lesson) => lesson.id)
      );
      const removedIndex = currentOrder.indexOf(lessonId);

      const modules = prev.modules.map((module, moduleIndex) => {
        if (module.id !== moduleId) {
          return module;
        }

        const lessons = module.lessons.filter((lesson) => lesson.id !== lessonId);
        return { ...module, lessons };
      });

      const nextOrder = modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));

      let selectedLessonId = prev.selectedLessonId;
      if (prev.selectedLessonId === lessonId) {
        selectedLessonId =
          nextOrder[Math.min(removedIndex, nextOrder.length - 1)] || nextOrder[0] || null;
      }

      return {
        ...prev,
        modules,
        selectedLessonId,
      };
    });
  }

  function handleToggleLessonComplete(moduleId, lessonId) {
    updateState((prev) => ({
      ...prev,
      modules: prev.modules.map((module) => {
        if (module.id !== moduleId) {
          return module;
        }

        return {
          ...module,
          lessons: module.lessons.map((lesson) =>
            lesson.id === lessonId
              ? {
                  ...lesson,
                  completed: !lesson.completed,
                }
              : lesson
          ),
        };
      }),
    }));
  }

  function handleUpdateLessonTitle(moduleId, lessonId, title) {
    updateState((prev) => ({
      ...prev,
      modules: prev.modules.map((module) => {
        if (module.id !== moduleId) {
          return module;
        }

        return {
          ...module,
          lessons: module.lessons.map((lesson) =>
            lesson.id === lessonId
              ? {
                  ...lesson,
                  title,
                }
              : lesson
          ),
        };
      }),
    }));
  }

  function handleAddBlock(moduleId, lessonId, type) {
    updateState((prev) => ({
      ...prev,
      modules: prev.modules.map((module) => {
        if (module.id !== moduleId) {
          return module;
        }

        return {
          ...module,
          lessons: module.lessons.map((lesson) =>
            lesson.id === lessonId
              ? {
                  ...lesson,
                  blocks: [...lesson.blocks, createBlock(type)],
                }
              : lesson
          ),
        };
      }),
    }));
  }

  function handleDeleteBlock(moduleId, lessonId, blockId) {
    updateState((prev) => ({
      ...prev,
      modules: prev.modules.map((module) => {
        if (module.id !== moduleId) {
          return module;
        }

        return {
          ...module,
          lessons: module.lessons.map((lesson) => {
            if (lesson.id !== lessonId) {
              return lesson;
            }

            return {
              ...lesson,
              blocks: lesson.blocks.filter((block) => block.id !== blockId),
            };
          }),
        };
      }),
    }));
  }

  function handleUpdateBlock(moduleId, lessonId, blockId, value) {
    updateState((prev) => ({
      ...prev,
      modules: prev.modules.map((module) => {
        if (module.id !== moduleId) {
          return module;
        }

        return {
          ...module,
          lessons: module.lessons.map((lesson) => {
            if (lesson.id !== lessonId) {
              return lesson;
            }

            return {
              ...lesson,
              blocks: lesson.blocks.map((block) =>
                block.id === blockId
                  ? {
                      ...block,
                      value,
                    }
                  : block
              ),
            };
          }),
        };
      }),
    }));
  }

  function handleLessonDragStart(event, moduleId, lessonId) {
    if (event.dataTransfer) {
      event.dataTransfer.setData("text/plain", lessonId);
      event.dataTransfer.effectAllowed = "move";
    }

    dragStateRef.current = { moduleId, lessonId };
  }

  function handleDragEnd() {
    dragStateRef.current = null;
  }

  function handleDropLesson(targetModuleId, targetLessonId) {
    const dragState = dragStateRef.current;
    if (!dragState) {
      return;
    }

    updateState((prev) => ({
      ...prev,
      modules: moveLesson(
        prev.modules,
        dragState.moduleId,
        dragState.lessonId,
        targetModuleId,
        targetLessonId
      ),
    }));

    dragStateRef.current = null;
  }

  function handleDropModule(targetModuleId) {
    const dragState = dragStateRef.current;
    if (!dragState) {
      return;
    }

    updateState((prev) => ({
      ...prev,
      modules: moveLesson(
        prev.modules,
        dragState.moduleId,
        dragState.lessonId,
        targetModuleId,
        null
      ),
    }));

    dragStateRef.current = null;
  }

  return (
    <div className="relative mx-auto max-w-[1500px] p-3 md:p-5">
      <div className="relative flex h-[calc(100vh-1.5rem)] overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/70 shadow-soft backdrop-blur-xl md:h-[calc(100vh-2.5rem)]">
        <Sidebar
          modules={state.modules}
          selectedLessonId={state.selectedLessonId}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onToggleModule={handleToggleModule}
          onSelectLesson={selectLesson}
          onAddModule={handleAddModule}
          onDeleteModule={handleDeleteModule}
          onAddLesson={handleAddLesson}
          onDeleteLesson={handleDeleteLesson}
          onToggleLessonComplete={handleToggleLessonComplete}
          onLessonDragStart={handleLessonDragStart}
          onLessonDrop={handleDropLesson}
          onModuleDrop={handleDropModule}
          onDragEnd={handleDragEnd}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            selectedModule={selectedModule}
            selectedLessonId={state.selectedLessonId}
            overallProgress={overallProgress}
            onOpenSidebar={() => setMobileSidebarOpen(true)}
            onSelectStep={selectLesson}
          />

          <main className="sidebar-scroll flex-1 overflow-y-auto px-4 pb-6 pt-4 md:px-8 md:pb-10 md:pt-6">
            <LessonView
              selectedModule={selectedModule}
              selectedLesson={selectedLesson}
              onUpdateLessonTitle={(title) =>
                selectedModule &&
                selectedLesson &&
                handleUpdateLessonTitle(selectedModule.id, selectedLesson.id, title)
              }
              onToggleLessonComplete={() =>
                selectedModule &&
                selectedLesson &&
                handleToggleLessonComplete(selectedModule.id, selectedLesson.id)
              }
              onAddBlock={(type) =>
                selectedModule &&
                selectedLesson &&
                handleAddBlock(selectedModule.id, selectedLesson.id, type)
              }
              onDeleteBlock={(blockId) =>
                selectedModule &&
                selectedLesson &&
                handleDeleteBlock(selectedModule.id, selectedLesson.id, blockId)
              }
              onUpdateBlock={(blockId, value) =>
                selectedModule &&
                selectedLesson &&
                handleUpdateBlock(selectedModule.id, selectedLesson.id, blockId, value)
              }
            />
          </main>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
