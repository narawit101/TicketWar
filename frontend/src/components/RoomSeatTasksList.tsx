import React from "react";
import { SeatTask } from "@/types";
import { SeatTaskCard } from "@/components/SeatTaskCard";
import { Plus, Target } from "lucide-react";

interface RoomSeatTasksListProps {
  tasks: SeatTask[];
  currentUserName: string;
  isReadOnly: boolean;
  onAddTask: () => void;
  onIncrement: (taskId: string) => void;
  onDecrement: (taskId: string) => void;
  onEditTask: (task: SeatTask) => void;
  onDeleteTask: (taskId: string, targetLocation: string) => void;
}

export const RoomSeatTasksList: React.FC<RoomSeatTasksListProps> = ({
  tasks,
  currentUserName,
  isReadOnly,
  onAddTask,
  onIncrement,
  onDecrement,
  onEditTask,
  onDeleteTask,
}) => {
  return (
    <div className="lg:col-span-3 h-120 sm:h-135 lg:h-full flex flex-col min-h-0 overflow-hidden">
      {/* List Header */}
      <div className="shrink-0 flex items-center justify-between px-0.5 mb-2">
        <span className="text-md text-zinc-400 font-medium">
          รายการที่นั่ง ({tasks.length})
        </span>
        {!isReadOnly && (
          <button
            onClick={onAddTask}
            className="px-3.5 py-1.5 rounded-full bg-[#1ed760] hover:bg-[#1cd05a] text-black text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-md active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>เพิ่มที่นั่ง</span>
          </button>
        )}
      </div>

      {/* Seat Tasks List - Independently Scrollable */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
        {tasks.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-200">
                ยังไม่มีที่นั่งเป้าหมาย
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                กดปุ่ม &quot;เพิ่มที่นั่ง&quot; เพื่อระบุโซนและจำนวนที่ต้องการ
              </p>
            </div>
            {!isReadOnly && (
              <button
                onClick={onAddTask}
                className="px-4 py-2 bg-[#1ed760] hover:bg-[#1cd05a] text-black text-xs font-bold rounded-full cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>เพิ่มที่นั่ง</span>
              </button>
            )}
          </div>
        ) : (
          tasks.map((task) => (
            <SeatTaskCard
              key={task.id}
              task={task}
              currentUserName={currentUserName}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              onEdit={onEditTask}
              onDelete={(taskId) => onDeleteTask(taskId, task.targetLocation)}
              isReadOnly={isReadOnly}
            />
          ))
        )}
      </div>
    </div>
  );
};
