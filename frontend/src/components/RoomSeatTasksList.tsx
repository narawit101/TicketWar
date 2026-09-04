import React, { useState } from "react";
import { SeatTask, RoomMemberItem, TaskAssignee } from "@/types";
import { SeatTaskCard } from "@/components/SeatTaskCard";
import { Plus, Target } from "lucide-react";

interface RoomSeatTasksListProps {
  tasks: SeatTask[];
  members?: RoomMemberItem[];
  currentUserId?: string;
  currentUserName?: string;
  isReadOnly: boolean;
  onAddTask: () => void;
  onAssignTask?: (taskId: string, targetUser: TaskAssignee | null) => void;
  onStartPendingPayment?: (
    taskId: string,
    zoneType: "MAIN" | "BACKUP",
    zoneName: string,
    price: number,
  ) => void;
  onConfirmPayment?: (taskId: string, pendingId: string) => void;
  onDirectSecured?: (
    taskId: string,
    zoneType: "MAIN" | "BACKUP",
    zoneName: string,
  ) => void;
  onCancelPendingPayment?: (taskId: string, pendingId: string) => void;
  onDecrement: (taskId: string) => void;
  onEditTask: (task: SeatTask) => void;
  onDeleteTask: (taskId: string, targetLocation: string) => void;
  onViewSeatingPlan?: () => void;
}

export const RoomSeatTasksList: React.FC<RoomSeatTasksListProps> = ({
  tasks,
  members = [],
  currentUserId,
  currentUserName,
  isReadOnly,
  onAddTask,
  onAssignTask,
  onStartPendingPayment,
  onConfirmPayment,
  onDirectSecured,
  onCancelPendingPayment,
  onDecrement,
  onEditTask,
  onDeleteTask,
  onViewSeatingPlan,
}) => {
  const [activeTab, setActiveTab] = useState<"ALL" | "MY">("ALL");

  const checkIsMyTask = (t: SeatTask) => {
    if (
      t.assignees?.some(
        (a) =>
          (currentUserId && a.userId === currentUserId) ||
          (currentUserName && a.name === currentUserName),
      ) ||
      (currentUserId && t.assignee?.userId === currentUserId) ||
      (currentUserName && t.assignee?.name === currentUserName)
    ) {
      return true;
    }
    return false;
  };

  const myTasksCount = tasks.filter(checkIsMyTask).length;

  const displayedTasks = [...tasks]
    .filter((t) => activeTab === "ALL" || checkIsMyTask(t))
    .sort((a, b) => {
      // In ALL tab, tasks belonging to "Me" come first!
      if (activeTab === "ALL") {
        const aIsMine = checkIsMyTask(a);
        const bIsMine = checkIsMyTask(b);
        if (aIsMine && !bIsMine) return -1;
        if (!aIsMine && bIsMine) return 1;
      }
      // Then sort by targetDate (earliest / closest first)
      const dateA = new Date(a.targetDate).getTime();
      const dateB = new Date(b.targetDate).getTime();
      return dateA - dateB;
    });

  return (
    <div className="lg:col-span-4 h-120 sm:h-135 lg:h-full flex flex-col min-h-0 overflow-hidden">
      {/* List Header: Tabs (All / My) & Add Task Button */}
      <div className="shrink-0 flex items-center justify-between gap-2 px-0.5 mb-2.5 flex-wrap">
        {/* ClickUp-Style Tabs: งานทั้งหมด / งานของฉัน */}
        <div className="flex items-center gap-1 bg-[#161616] p-0.5 rounded-full border border-[#2a2a2a]">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-[#282828] text-white shadow-sm"
                : "text-[#888888] hover:text-white"
            }`}
          >
            งานทั้งหมด ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("MY")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "MY"
                ? "bg-[#1ed760] text-black shadow-sm"
                : "text-[#888888] hover:text-white"
            }`}
          >
            <span>งานของฉัน</span>
            {myTasksCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "MY"
                    ? "bg-black/25 text-black font-extrabold"
                    : "bg-[#252525] text-[#1ed760] font-bold"
                }`}
              >
                {myTasksCount}
              </span>
            )}
          </button>
        </div>

        {!isReadOnly && (
          <button
            onClick={onAddTask}
            className="px-3.5 py-1.5 rounded-full bg-[#1ed760] hover:bg-[#1cd05a] text-black text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>เพิ่มที่นั่ง</span>
          </button>
        )}
      </div>

      {/* Seat Tasks List - Independently Scrollable */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
        {displayedTasks.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-200">
                {activeTab === "MY"
                  ? "ยังไม่มีงานที่มอบหมายให้คุณ"
                  : "ยังไม่มีที่นั่งเป้าหมาย"}
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                {activeTab === "MY"
                  ? "กดมอบหมายงานเพื่อดึงงานเข้ามาในแท็บนี้ หรือกด 'งานทั้งหมด' เพื่อดูงานอื่นๆ"
                  : 'กดปุ่ม "เพิ่มที่นั่ง" เพื่อระบุโซนและจำนวนที่ต้องการ'}
              </p>
            </div>
            {!isReadOnly && activeTab === "ALL" && (
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
          displayedTasks.map((task) => (
            <SeatTaskCard
              key={task.id}
              task={task}
              members={members}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              isMyTask={checkIsMyTask(task)}
              onAssignTask={onAssignTask}
              onStartPendingPayment={onStartPendingPayment}
              onConfirmPayment={onConfirmPayment}
              onDirectSecured={onDirectSecured}
              onCancelPendingPayment={onCancelPendingPayment}
              onDecrement={onDecrement}
              onEdit={onEditTask}
              onDelete={(taskId) => onDeleteTask(taskId, task.targetLocation)}
              isReadOnly={isReadOnly}
              onViewSeatingPlan={onViewSeatingPlan}
            />
          ))
        )}
      </div>
    </div>
  );
};
