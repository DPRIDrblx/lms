"use client";

import React, { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Building, Trash2, Plus, DoorOpen, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function BranchRoomsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const branchId = resolvedParams.id;
  const supabase = createClient();

  const [branch, setBranch] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingFloor, setAddingFloor] = useState<number | null>(null);

  const floors = [1, 2, 3, 4, 5, 6, 7];

  const fetchRooms = async () => {
    setLoading(true);
    // Fetch Branch Name
    const { data: branchData } = await supabase
      .from("nia_branches")
      .select("*")
      .eq("id", branchId)
      .single();
    if (branchData) setBranch(branchData);

    // Fetch Rooms
    const { data: roomsData } = await supabase
      .from("branch_rooms")
      .select("*")
      .eq("branch_id", branchId)
      .order("room_number", { ascending: true });
    
    if (roomsData) setRooms(roomsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, [branchId, supabase]);

  const handleAddRoom = async (floor: number) => {
    setAddingFloor(floor);
    
    // Find highest room number in this floor
    const floorRooms = rooms.filter(r => r.floor === floor);
    let newRoomNumberStr = `${floor}01`;

    if (floorRooms.length > 0) {
      // Find the max room number mathematically
      // We assume room_number is format like 301, 302
      let maxNum = 0;
      floorRooms.forEach(r => {
        const num = parseInt(r.room_number, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      });
      if (maxNum > 0) {
        newRoomNumberStr = (maxNum + 1).toString();
      }
    }

    const { error } = await supabase.from("branch_rooms").insert({
      branch_id: branchId,
      floor: floor,
      room_number: newRoomNumberStr,
      capacity: 20 // Default capacity
    });

    if (error) {
      toast.error("Gagal menambah ruangan: " + error.message);
    } else {
      toast.success(`Ruangan ${newRoomNumberStr} berhasil ditambahkan!`);
      await fetchRooms();
    }
    
    setAddingFloor(null);
  };

  const handleDeleteRoom = async (roomId: string, roomNumber: string) => {
    if (!window.confirm(`Yakin ingin menghapus ruangan ${roomNumber}?`)) return;

    const { error } = await supabase.from("branch_rooms").delete().eq("id", roomId);
    if (error) {
      toast.error("Gagal menghapus ruangan: " + error.message);
    } else {
      toast.success(`Ruangan ${roomNumber} berhasil dihapus!`);
      await fetchRooms();
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/operator-les/branches">
          <Button variant="secondary" size="sm" className="rounded-full px-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-2">
            <Building className="w-7 h-7 text-blue-600" />
            Manajemen Ruangan
          </h1>
          <p className="text-slate-500 font-medium">
            {branch ? `Cabang: ${branch.name}` : "Memuat informasi cabang..."}
          </p>
        </div>
      </div>

      {loading && rooms.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {floors.map(floor => {
            const floorRooms = rooms.filter(r => r.floor === floor);
            const isAdding = addingFloor === floor;

            return (
              <div key={floor} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">Lantai {floor}</h2>
                  <Button 
                    onClick={() => handleAddRoom(floor)} 
                    disabled={isAdding}
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
                  >
                    {isAdding ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Plus className="w-4 h-4" />}
                    Tambah Ruangan
                  </Button>
                </div>
                
                <div className="p-6">
                  {floorRooms.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-medium text-sm border-2 border-dashed border-slate-100 rounded-xl">
                      Belum ada ruangan di Lantai {floor}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {floorRooms.map(room => (
                        <div key={room.id} className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all">
                          <button 
                            onClick={() => handleDeleteRoom(room.id, room.room_number)}
                            className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                            title="Hapus Ruangan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <div className="flex flex-col items-center text-center">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-2">
                              <DoorOpen className="w-5 h-5" />
                            </div>
                            <h3 className="font-black text-xl text-slate-800 mb-1">{room.room_number}</h3>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                              <Users className="w-3 h-3" />
                              Kapasitas: {room.capacity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
