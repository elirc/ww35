import { describe, expect, it } from "vitest";
import { buildAvailabilitySlots, isSlotOpen, getSlotWindowLabel } from "@/lib/availability/schedule";
import { ValidationAppError } from "@/lib/errors";
const slot=(start:string,end:string)=>({startsAt:new Date(start),endsAt:new Date(end)});
const calendar=(timezone="UTC",startMinute=9*60,endMinute=17*60)=>({timezone,workingHoursRules:Array.from({length:7},(_,dayOfWeek)=>({dayOfWeek,startMinute,endMinute,active:true})),blockedWindows:[] as ReturnType<typeof slot>[]});
describe("local calendar boundaries",()=>{
 it("rejects a late-night interval whose next-day end minute looks like daytime",()=>{
  expect(isSlotOpen(slot("2026-09-21T23:30Z","2026-09-22T00:30Z"),calendar())).toBe(false);
  expect(isSlotOpen(slot("2026-09-21T16:00Z","2026-09-22T10:00Z"),calendar())).toBe(false);
 });
 it("permits exact next midnight only against an endMinute of 1440",()=>{
  const window=slot("2026-09-21T23:30Z","2026-09-22T00:00Z");expect(isSlotOpen(window,calendar("UTC",0,1440))).toBe(true);
  expect(isSlotOpen(window,calendar("UTC",0,1439))).toBe(false);
  expect(getSlotWindowLabel(window,"UTC")).toContain("00:00");expect(getSlotWindowLabel(window,"UTC")).not.toContain("24:00");
 });
 it("uses local date boundaries on a DST transition day",()=>{
  expect(isSlotOpen(slot("2026-03-09T03:30Z","2026-03-09T04:00Z"),calendar("America/New_York",0,1440))).toBe(true);
  expect(isSlotOpen(slot("2026-03-09T03:30Z","2026-03-09T04:30Z"),calendar("America/New_York",0,1440))).toBe(false);
  expect(isSlotOpen(slot("2026-11-01T05:45Z","2026-11-01T06:15Z"),calendar("America/New_York",0,1440))).toBe(false);
 });
 it("keeps adjacent half-open appointments available and rejects positive overlap",()=>{
  const blocked=slot("2026-09-21T10:00Z","2026-09-21T10:30Z");const window={...calendar(),blockedWindows:[blocked]};
  expect(isSlotOpen(slot("2026-09-21T09:30Z","2026-09-21T10:00Z"),window)).toBe(true);
  expect(isSlotOpen(slot("2026-09-21T10:30Z","2026-09-21T11:00Z"),window)).toBe(true);
  expect(isSlotOpen(slot("2026-09-21T10:15Z","2026-09-21T10:45Z"),window)).toBe(false);
 });
 it.each([0,-1,NaN,Infinity,0.5,Number.MAX_SAFE_INTEGER])("rejects unsafe slot interval %s before looping",slotMinutes=>{
  expect(()=>buildAvailabilitySlots({...slot("2026-09-21T09:00Z","2026-09-21T10:00Z"),...calendar(),slotMinutes})).toThrow(ValidationAppError);
 });
 it("rejects invalid and reversed ranges, invalid zones and malformed rules",()=>{
  for(const range of [slot("invalid","2026-09-21T10:00Z"),slot("2026-09-21T11:00Z","2026-09-21T10:00Z")])expect(()=>isSlotOpen(range,calendar())).toThrow(ValidationAppError);
  const window=slot("2026-09-21T09:00Z","2026-09-21T10:00Z");expect(()=>isSlotOpen(window,calendar("not-a-zone"))).toThrow(ValidationAppError);
  expect(()=>isSlotOpen(window,calendar("UTC",1000,900))).toThrow(ValidationAppError);
 });
 it("preview slots and direct booking eligibility share the same predicate",()=>{
  const range=slot("2026-09-21T09:00Z","2026-09-21T11:00Z");const rules={...calendar(),blockedWindows:[slot("2026-09-21T10:00Z","2026-09-21T10:30Z")]};
  const slots=buildAvailabilitySlots({...range,...rules,slotMinutes:30});expect(slots).toHaveLength(4);expect(slots.map(item=>item.isOpen)).toEqual([true,true,false,true]);
  for(const value of slots)expect(value.isOpen).toBe(isSlotOpen(value,rules));
 });
});
