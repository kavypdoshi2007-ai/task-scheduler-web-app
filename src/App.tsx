/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayCircle, User, PlusCircle, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

interface Task {
  id: number;
  name: string;
  priority: number;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeScreen, setActiveScreen] = useState('Focus');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('5');
  const [executedTask, setExecutedTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) {
      setError('Task name cannot be empty');
      return;
    }

    try {
      const res = await fetch('/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTaskName, priority: newTaskPriority }),
      });
      
      if (res.ok) {
        setNewTaskName('');
        setNewTaskPriority('5');
        setError(null);
        fetchTasks();
      }
    } catch (err) {
      setError('Server connection failed');
    }
  };

  const executeTask = async () => {
    try {
      const res = await fetch('/api/execute', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        setExecutedTask(data.task);
        fetchTasks();
        setTimeout(() => setExecutedTask(null), 5000);
      } else {
        setError(data.error);
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError('Execution failed');
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      setError('Deletion failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased selection:bg-primary-container/30">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-outline-variant/10 shadow-[0_20px_50px_rgba(99,102,241,0.05)]">
        <div className="flex justify-between items-center max-w-4xl mx-auto px-8 h-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <PlusCircle size={20} className="text-on-primary-container" />
            </div>
            <div className="text-xl font-bold tracking-tighter text-on-surface">Task Schedular</div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {['Focus', 'Archive', 'Settings'].map((item) => (
              <button
                key={item}
                onClick={() => setActiveScreen(item)}
                className={`relative py-1 text-sm transition-colors duration-300 ${
                  activeScreen === item ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {item}
                {activeScreen === item && (
                  <motion.div
                    layoutId="nav-line"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-primary/10 rounded-full transition-all active:scale-95 duration-150 text-on-surface">
              <User size={24} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-32 pb-24 px-6 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeScreen === 'Focus' && (
            <motion.div
              key="focus-screen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Task Form */}
              <section className="mb-16">
                <form onSubmit={addTask} className="space-y-4">
                  <div className="relative group">
                    <input
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      placeholder="add task here"
                      className="w-full bg-surface-container-lowest border-none rounded-2xl px-8 py-5 text-lg font-mono placeholder:text-on-surface-variant/30 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-highest transition-all duration-300 shadow-xl text-on-surface"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-xl -z-10 opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  </div>
                  
                  <div className="flex items-center gap-4 px-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-outline-variant">Priority:</label>
                    <select 
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                      className="bg-surface-container-low border-none rounded-lg px-4 py-2 text-sm font-mono text-on-surface focus:ring-0 cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n}>{n} {n === 10 ? '(Critical)' : ''}</option>
                      ))}
                    </select>
                    <button 
                      type="submit"
                      className="ml-auto flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-6 py-2 rounded-xl text-sm font-bold transition-all"
                    >
                      <PlusCircle size={18} />
                      add to queue
                    </button>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-tertiary-container text-xs px-2"
                    >
                      <AlertCircle size={14} />
                      {error}
                    </motion.div>
                  )}
                </form>
              </section>

              {/* Status Message for Executed Task */}
              <AnimatePresence>
                {executedTask && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mb-8 p-6 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                      <CheckCircle2 size={24} className="text-on-primary-container" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-1">Execution Complete</p>
                      <h4 className="text-on-surface font-bold">Processed: {executedTask.name}</h4>
                      <p className="text-xs text-on-surface-variant">Priority {executedTask.priority} resolved.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Button */}
              <section className="mb-12">
                <button 
                  onClick={executeTask}
                  disabled={tasks.length === 0}
                  className="w-full py-6 rounded-full bg-gradient-to-br from-primary-container to-primary text-on-primary-container font-bold text-lg tracking-tight shadow-[0_10px_30px_rgba(128,131,255,0.2)] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3"
                >
                  <PlayCircle size={22} fill="currentColor" className="text-on-primary-container" />
                  execute prior task
                </button>
              </section>

              {/* Task List */}
              <section className="space-y-6">
                <div className="flex justify-between items-end mb-8 px-2">
                  <h2 className="text-[10px] font-mono uppercase tracking-[0.3em] text-outline-variant">Hierarchical Backlog</h2>
                  <span className="text-[10px] font-mono text-outline-variant">{tasks.length} Nodes in Heap</span>
                </div>
                
                {tasks.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-4 opacity-30 grayscale">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcUCLR_Q9zDg_lzH4qnTF1ka2q_jGzg0jZ9FQ0acapfYzNWAFZY9rjee2wt2CqIHXQdzaBbAG-rWx80rgJHGffoDNfASKmzoCCEfOF7J4MiyBgvVKJkJcl5HGe0ey9399lvnJH06aXzVaWdoxjI486nA5gy2okw6CLCku2QqGS6R5csZv2xUyCjSlUyCF2vHhWCr8bSbtjdVj89Sadxk62EgFboqY573ejhiHwTZQt-IKveFqCJTnQvgbo2OR-eghUu1ZLgigazH0"
                      alt="No tasks"
                      className="w-24 h-24 object-contain"
                    />
                    <p className="font-mono text-[10px] tracking-widest uppercase">The void is complete</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className={`${
                          index === 0 ? 'glass-surface' : 'bg-surface-container-low hover:bg-surface-container'
                        } p-6 rounded-2xl flex items-center gap-6 relative overflow-hidden group transition-colors duration-300`}
                      >
                        {index === 0 && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                        )}
                        <div className="pl-4 flex-grow">
                          <div className="flex items-center gap-3 mb-1">
                            {index === 0 && (
                              <span className="task-pulse pl-5 text-[10px] font-mono text-primary uppercase tracking-tighter">Peak Priority</span>
                            )}
                            <span className="text-[10px] font-mono text-outline-variant">ID-{1000 + task.id}</span>
                          </div>
                          <h3 className={`text-lg transition-colors ${index === 0 ? 'font-bold text-on-surface' : 'font-medium text-on-surface-variant group-hover:text-on-surface'}`}>
                            {task.name}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                            className="md:opacity-0 group-hover:opacity-100 p-2 hover:bg-tertiary-container/10 text-outline-variant hover:text-tertiary-container rounded-lg transition-all active:scale-90"
                            title="Delete task"
                          >
                            <Trash2 size={18} strokeWidth={1.5} />
                          </button>
                          <PriorityTag priority={task.priority} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {activeScreen !== 'Focus' && (
            <motion.div
              key="fallback-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-on-surface-variant"
            >
              <p className="font-mono text-sm uppercase tracking-widest">{activeScreen} view is under construction.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto py-12 flex flex-col items-center justify-center gap-4 opacity-40 hover:opacity-100 transition-opacity duration-500 cursor-default">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-outline flex flex-col items-center gap-4">
          <p>© 2026 Task Schedular. Real-time C++ Simulated Runtime.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-on-surface transition-colors">Support</a>
            <a href="#" className="hover:text-on-surface transition-colors">Keyboard Shortcuts</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PriorityTag({ priority }: { priority: number }) {
  if (priority >= 8) {
    return (
      <div className="bg-tertiary-container/10 text-tertiary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,81,106,0.1)] border border-tertiary-container/20">
        Critical [{priority}]
      </div>
    );
  }
  
  if (priority >= 4) {
    return (
      <div className="bg-secondary-container/30 text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-outline-variant/10">
        Priority [{priority}]
      </div>
    );
  }

  return (
    <div className="bg-surface-container-highest/50 text-outline px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-outline-variant/10">
      Routine [{priority}]
    </div>
  );
}
