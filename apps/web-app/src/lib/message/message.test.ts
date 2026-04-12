import { describe, it, expect } from "vitest";
import { traverseByParentId } from "./message";
import type { Message } from "@/types";

const testMessages: Message[] = [
  {
    info: {
      role: "assistant",
      time: { created: 1775960018079, completed: 1775960019821 },
      error: { name: "MessageAbortedError", data: { message: "The operation was aborted." } },
      parentID: "msg_nonexistent",
      id: "msg_d7f774c9f001PUkvw9kTiaBKaO",
      modelID: "minimax-m2.7",
      providerID: "opencode-go",
      mode: "build",
      agent: "build",
      path: { cwd: "/home/admin/deploy/cloudy/assistant", root: "/" },
      cost: 0,
      tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
      sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
    },
    parts: [],
  },
  {
    info: {
      role: "user",
      time: { created: 1775960018068 },
      summary: { diffs: [] },
      agent: "build",
      model: { providerID: "opencode-go", modelID: "minimax-m2.7" },
      id: "msg_d7f774c94001guJ6VIaI1KSSMm",
      sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
    },
    parts: [
      {
        type: "text",
        text: "@mem2026-04",
        id: "prt_d7f774c94002DN0grELBe9O3ur",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f774c94001guJ6VIaI1KSSMm",
      },
    ],
  },
  {
    info: {
      role: "user",
      time: { created: 1775960063211 },
      summary: { diffs: [] },
      agent: "build",
      model: { providerID: "opencode-go", modelID: "minimax-m2.7" },
      id: "msg_d7f77fceb001N4iTdBCL4YBPwZ",
      sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
    },
    parts: [
      {
        type: "text",
        text: "@memory/2026-04-08.md ลองเพิ่ม hello world ด้วย tool edit และ สร้าง memory ของวันนี้ ด้วยคำว่า hello world",
        id: "prt_d7f77fd58001mK1qY0wdtZDV3B",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f77fceb001N4iTdBCL4YBPwZ",
      },
      {
        type: "text",
        text: "Called the Read tool with the following input: {\"filePath\":\"/home/admin/deploy/cloudy/assistant/memory/2026-04-08.md\"}",
        synthetic: true,
        id: "prt_d7f77fd58002YnhqGwoUOk3mpR",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f77fceb001N4iTdBCL4YBPwZ",
      },
      {
        type: "text",
        text: "<path>/home/admin/deploy/cloudy/assistant/memory/2026-04-08.md</path>\n<type>file</type>\n<content>1: ---\n2: title: \"[Session] Speech Recognition in Cloudy\"\n3: tags: [\"memory\"]\n4: createdAt: 2026-04-08T12:29:26.000Z\n5: updatedAt: 2026-04-08T12:29:26.000Z\n6: ---\n7: \n8: ## Context\n9: \n10: Larb implemented **Speech to Text** feature in Cloudy using **Web Speech API** (browser built-in).\n11: \n12: ## What was built\n13: \n14: - Speech recognition that allows users to speak and convert speech to text in the chat\n15: - Uses Web Speech API (browser's built-in speech recognition)\n16: \n17: ## Notes\n18: \n19: - Web Speech API is the browser built-in API for speech recognition\n20: - No external services (like Whisper) needed\n\n(End of file - total 20 lines)",
        synthetic: true,
        id: "prt_d7f77fd58003PltUQ3SfRTwGrh",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f77fceb001N4iTdBCL4YBPwZ",
      },
      {
        type: "file",
        mime: "text/plain",
        filename: "memory/2026-04-08.md",
        url: "file:///home/admin/deploy/cloudy/assistant/memory/2026-04-08.md",
        source: {
          text: { value: "memory/2026-04-08.md", start: 0, end: 20 },
          type: "file",
          path: "/home/admin/deploy/cloudy/assistant/memory/2026-04-08.md",
        },
        id: "prt_d7f77fd58004izMt3a7hM34mn2",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f77fceb001N4iTdBCL4YBPwZ",
      },
    ],
  },
  {
    info: {
      role: "assistant",
      time: { created: 1775960063421, completed: 1775960067737 },
      parentID: "msg_d7f77fceb001N4iTdBCL4YBPwZ",
      modelID: "minimax-m2.7",
      providerID: "opencode-go",
      mode: "build",
      agent: "build",
      path: { cwd: "/home/admin/deploy/cloudy/assistant", root: "/" },
      cost: 0.001071,
      tokens: { total: 13015, input: 80, output: 256, reasoning: 0, cache: { read: 12330, write: 349 } },
      finish: "tool-calls",
      id: "msg_d7f77fdbd001C0HxwN0zTpHmsz",
      sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
    },
    parts: [
      { type: "step-start", id: "prt_d7f780327001boq8fb1pIc3Vc3", sessionID: "ses_28088b38bffeA99m5h9EomrL5l", messageID: "msg_d7f77fdbd001C0HxwN0zTpHmsz" },
      {
        type: "reasoning",
        text: "The user wants me to:\n1. Add \"hello world\" using the edit tool to the file memory/2026-04-08.md\n2. Create a memory file for today (2026-04-12)\n\nLet me do both tasks.",
        metadata: { anthropic: { signature: "6ed97bb918a32d2def8ad1b15eab5ceb52fc8627fa56a718922e3525e530644c" } },
        time: { start: 1775960064815, end: 1775960065596 },
        id: "prt_d7f78032f001GIzcshuvmmxQ2e",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f77fdbd001C0HxwN0zTpHmsz",
      },
      {
        type: "tool",
        callID: "call_function_uln6dlyy149j_1",
        tool: "edit",
        state: {
          status: "error",
          input: { filePath: "/home/admin/deploy/cloudy/assistant/memory/2026-04-08.md", oldString: "(End of file - total 20 lines)", newString: "- No external services (like Whisper) needed\n\n## Test\n- hello world" },
          error: "Error: Could not find oldString in the file. It must match exactly, including whitespace, indentation, and line endings.",
          time: { start: 1775960066378, end: 1775960066389 },
        },
        id: "prt_d7f78063f001avLfWDK30Z4dQl",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f77fdbd001C0HxwN0zTpHmsz",
      },
      {
        type: "tool",
        callID: "call_function_uln6dlyy149j_2",
        tool: "write",
        state: {
          status: "completed",
          input: { content: "---\ntitle: \"[Session] Test memory\"\ntags: [\"memory\"]\ncreatedAt: 2026-04-12T00:00:00.000Z\nupdatedAt: 2026-04-12T00:00:00.000Z\n---\n\n## Context\n\n\n\n## Notes\n\n", filePath: "/home/admin/deploy/cloudy/assistant/memory/2026-04-12.md" },
          output: "Wrote file successfully.",
          title: "home/admin/deploy/cloudy/assistant/memory/2026-04-12.md",
          metadata: { diagnostics: { "/home/admin/deploy/cloudy/docker-compose.yml": [] }, filepath: "/home/admin/deploy/cloudy/assistant/memory/2026-04-12.md", exists: false, truncated: false },
          time: { start: 1775960067654, end: 1775960067659 },
        },
        id: "prt_d7f78094c001HkhQw4QeUlgvtR",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f77fdbd001C0HxwN0zTpHmsz",
      },
      {
        type: "step-finish",
        reason: "tool-calls",
        cost: 0.001071,
        tokens: { total: 13015, input: 80, output: 256, reasoning: 0, cache: { read: 12330, write: 349 } },
        id: "prt_d7f780e90001Y2wgZkYdQop9rC",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f77fdbd001C0HxwN0zTpHmsz",
      },
    ],
  },
  {
    info: {
      role: "assistant",
      time: { created: 1775960067739, completed: 1775960071483 },
      parentID: "msg_d7f77fceb001N4iTdBCL4YBPwZ",
      modelID: "minimax-m2.7",
      providerID: "opencode-go",
      mode: "build",
      agent: "build",
      path: { cwd: "/home/admin/deploy/cloudy/assistant", root: "/" },
      cost: 0.000981,
      tokens: { total: 13231, input: 120, output: 171, reasoning: 0, cache: { read: 12330, write: 610 } },
      finish: "tool-calls",
      id: "msg_d7f780e9b001GSRdWgAWKAKVdY",
      sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
    },
    parts: [
      { type: "step-start", id: "prt_d7f781486001r1ZklsfJEQoSKc", sessionID: "ses_28088b38bffeA99m5h9EomrL5l", messageID: "msg_d7f780e9b001GSRdWgAWKAKVdY" },
      {
        type: "reasoning",
        text: "The edit failed because the oldString didn't match exactly. Let me check the file again and fix the edit. The file had \"(End of file - total 20 lines)\" but maybe there was a newline issue.\n\nThe write for 2026-04-12.md succeeded.\n\nLet me retry the edit with the correct string.",
        metadata: { anthropic: { signature: "bb725ba19dcf45bc2e13817fa2d9395ba71aa3001c498ede99428ef3b1161304" } },
        time: { start: 1775960069258, end: 1775960070898 },
        id: "prt_d7f78148a001C4ZLKfHoxlSDZm",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f780e9b001GSRdWgAWKAKVdY",
      },
      {
        type: "tool",
        callID: "call_function_zo6k28ciboju_1",
        tool: "edit",
        state: {
          status: "error",
          input: { filePath: "/home/admin/deploy/cloudy/assistant/memory/2026-04-08.md", oldString: "- No external services (like Whisper) needed\n\n(End of file - total 20 lines)", newString: "- No external services (like Whisper) needed\n\n## Test\n- hello world" },
          error: "Error: Could not find oldString in the file. It must match exactly, including whitespace, indentation, and line endings.",
          time: { start: 1775960071402, end: 1775960071406 },
        },
        id: "prt_d7f781af3001B5woBzQFbfT73C",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f780e9b001GSRdWgAWKAKVdY",
      },
      {
        type: "step-finish",
        reason: "tool-calls",
        cost: 0.000981,
        tokens: { total: 13231, input: 120, output: 171, reasoning: 0, cache: { read: 12330, write: 610 } },
        id: "prt_d7f781d31001ZJjjeedTHhldzS",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f780e9b001GSRdWgAWKAKVdY",
      },
    ],
  },
  {
    info: {
      role: "assistant",
      time: { created: 1775960071485, completed: 1775960073328 },
      parentID: "msg_d7f77fceb001N4iTdBCL4YBPwZ",
      modelID: "minimax-m2.7",
      providerID: "opencode-go",
      mode: "build",
      agent: "build",
      path: { cwd: "/home/admin/deploy/cloudy/assistant", root: "/" },
      cost: 0.00088404,
      tokens: { total: 13345, input: 115, output: 74, reasoning: 0, cache: { read: 12679, write: 477 } },
      finish: "tool-calls",
      id: "msg_d7f781d3d001FXrvMPLuApQxPd",
      sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
    },
    parts: [
      { type: "step-start", id: "prt_d7f782224001be60hrr6YScmJV", sessionID: "ses_28088b38bffeA99m5h9EomrL5l", messageID: "msg_d7f781d3d001FXrvMPLuApQxPd" },
      {
        type: "reasoning",
        text: "Hmm still failing. Let me read the file again to see the exact content.",
        metadata: { anthropic: { signature: "f59c4f3d04b0a2797de0ffedd8e85594e85db104da05d060d8bc934cf97ed5c2" } },
        time: { start: 1775960072745, end: 1775960072942 },
        id: "prt_d7f782229001AoE7JIc5f3nUyr",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f781d3d001FXrvMPLuApQxPd",
      },
      {
        type: "tool",
        callID: "call_function_sgyixma8sobl_1",
        tool: "read",
        state: {
          status: "completed",
          input: { filePath: "/home/admin/deploy/cloudy/assistant/memory/2026-04-08.md", offset: 15 },
          output: "<path>/home/admin/deploy/cloudy/assistant/memory/2026-04-08.md</path>\n<type>file</type>\n<content>15: - Uses Web Speech API (browser's built-in speech recognition)\n16: \n17: ## Notes\n18: \n19: - Web Speech API is the browser built-in API for speech recognition\n20: - No external services (like Whisper) needed\n\n(End of file - total 20 lines)",
          title: "home/admin/deploy/cloudy/assistant/memory/2026-04-08.md",
          metadata: { preview: "- Uses Web Speech API (browser's built-in speech recognition)\n\n## Notes\n\n- Web Speech API is the browser built-in API for speech recognition\n- No external services (like Whisper) needed", truncated: false, loaded: [] },
          time: { start: 1775960073255, end: 1775960073274 },
        },
        id: "prt_d7f7822ef001hsBYMHcLHhB3Wd",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f781d3d001FXrvMPLuApQxPd",
      },
      {
        type: "step-finish",
        reason: "tool-calls",
        cost: 0.00088404,
        tokens: { total: 13345, input: 115, output: 74, reasoning: 0, cache: { read: 12679, write: 477 } },
        id: "prt_d7f782467001WI7I5x06rV0q7b",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f781d3d001FXrvMPLuApQxPd",
      },
    ],
  },
  {
    info: {
      role: "assistant",
      time: { created: 1775960073330, completed: 1775960076569 },
      parentID: "msg_d7f77fceb001N4iTdBCL4YBPwZ",
      modelID: "minimax-m2.7",
      providerID: "opencode-go",
      mode: "build",
      agent: "build",
      path: { cwd: "/home/admin/deploy/cloudy/assistant", root: "/" },
      cost: 0.0010434,
      tokens: { total: 13636, input: 194, output: 172, reasoning: 0, cache: { read: 12980, write: 290 } },
      finish: "tool-calls",
      id: "msg_d7f782472001PnRLMzLs4bimuW",
      sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
    },
    parts: [
      { type: "step-start", id: "prt_d7f782b31001XuaHCkpvKRCt8U", sessionID: "ses_28088b38bffeA99m5h9EomrL5l", messageID: "msg_d7f782472001PnRLMzLs4bimuW" },
      {
        type: "reasoning",
        text: "I see the issue - the file content shows line 20 ends with \"needed\" and then there's a newline, then the end of file marker. Let me try again with the exact content.",
        metadata: { anthropic: { signature: "f9c3a66aba15e1914b32adea5d38bfe23a72cf23276935e4ec517f1d40598fa7" } },
        time: { start: 1775960075060, end: 1775960075719 },
        id: "prt_d7f782b34001uARFf3iB2n268e",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f782472001PnRLMzLs4bimuW",
      },
      {
        type: "tool",
        callID: "call_function_par1qzt7onbe_1",
        tool: "edit",
        state: {
          status: "error",
          input: { filePath: "/home/admin/deploy/cloudy/assistant/memory/2026-04-08.md", oldString: "- Web Speech API is the browser built-in API for speech recognition\n- No external services (like Whisper) needed\n\n(End of file - total 20 lines)", newString: "- Web Speech API is the browser built-in API for speech recognition\n- No external services (like Whisper) needed\n\n## Test\n- hello world" },
          error: "Error: Could not find oldString in the file. It must match exactly, including whitespace, indentation, and line endings.",
          time: { start: 1775960076480, end: 1775960076483 },
        },
        id: "prt_d7f782dc9001GCMwQHGjQ4WfjU",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f782472001PnRLMzLs4bimuW",
      },
      {
        type: "step-finish",
        reason: "tool-calls",
        cost: 0.0010434,
        tokens: { total: 13636, input: 194, output: 172, reasoning: 0, cache: { read: 12980, write: 290 } },
        id: "prt_d7f783111001UBqiazXl06JbIN",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f782472001PnRLMzLs4bimuW",
      },
    ],
  },
  {
    info: {
      role: "assistant",
      time: { created: 1775960076572, completed: 1775960079054 },
      parentID: "msg_d7f77fceb001N4iTdBCL4YBPwZ",
      modelID: "minimax-m2.7",
      providerID: "opencode-go",
      mode: "build",
      agent: "build",
      path: { cwd: "/home/admin/deploy/cloudy/assistant", root: "/" },
      cost: 0.00093156,
      tokens: { total: 13764, input: 115, output: 88, reasoning: 0, cache: { read: 13191, write: 370 } },
      finish: "tool-calls",
      id: "msg_d7f78311b001V0QhUoaeRd6fdV",
      sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
    },
    parts: [
      { type: "step-start", id: "prt_d7f7836150019MOSsNN5e5AL8E", sessionID: "ses_28088b38bffeA99m5h9EomrL5l", messageID: "msg_d7f78311b001V0QhUoaeRd6fdV" },
      {
        type: "reasoning",
        text: "Hmm, still failing. Let me try reading the entire file to see the exact bytes.",
        metadata: { anthropic: { signature: "fb35b1d8ce0466130f8ab6aedfbdd1ad42af6003c15caa9174979c507ea8ebe6" } },
        time: { start: 1775960077849, end: 1775960078120 },
        id: "prt_d7f783619001CSEU49p0HUxWAL",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f78311b001V0QhUoaeRd6fdV",
      },
      {
        type: "tool",
        callID: "call_function_xf162wnu9z47_1",
        tool: "bash",
        state: {
          status: "completed",
          input: { command: "cat -A /home/admin/deploy/cloudy/assistant/memory/2026-04-08.md | tail -5", description: "Check exact file content with special chars" },
          output: "$\n## Notes$\n$\n- Web Speech API is the browser built-in API for speech recognition$\n- No external services (like Whisper) needed$\n",
          title: "Check exact file content with special chars",
          metadata: { output: "$\n## Notes$\n$\n- Web Speech API is the browser built-in API for speech recognition$\n- No external services (like Whisper) needed$\n", exit: 0, description: "Check exact file content with special chars", truncated: false },
          time: { start: 1775960078875, end: 1775960079030 },
        },
        id: "prt_d7f78372a001sj746tMzrakZri",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f78311b001V0QhUoaeRd6fdV",
      },
      {
        type: "step-finish",
        reason: "tool-calls",
        cost: 0.00093156,
        tokens: { total: 13764, input: 115, output: 88, reasoning: 0, cache: { read: 13191, write: 370 } },
        id: "prt_d7f783ab8001VS9uX2WqNUptZe",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f78311b001V0QhUoaeRd6fdV",
      },
    ],
  },
  {
    info: {
      role: "assistant",
      time: { created: 1775960079059, completed: 1775960082661 },
      parentID: "msg_d7f77fceb001N4iTdBCL4YBPwZ",
      modelID: "minimax-m2.7",
      providerID: "opencode-go",
      mode: "build",
      agent: "build",
      path: { cwd: "/home/admin/deploy/cloudy/assistant", root: "/" },
      cost: 0.00105654,
      tokens: { total: 13991, input: 121, output: 181, reasoning: 0, cache: { read: 13384, write: 305 } },
      finish: "tool-calls",
      id: "msg_d7f783ad3001y2uDUqtosDpXfA",
      sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
    },
    parts: [
      { type: "step-start", id: "prt_d7f784107001iFejur2eUpgCr9", sessionID: "ses_28088b38bffeA99m5h9EomrL5l", messageID: "msg_d7f783ad3001y2uDUqtosDpXfA" },
      {
        type: "reasoning",
        text: "So the file actually doesn't have the \"(End of file - total 20 lines)\" line - that was just the read tool's metadata. The actual file ends at line 20 with \"- No external services (like Whisper) needed$\"\n\nLet me edit to add after that line.",
        metadata: { anthropic: { signature: "de4b52b7c69b2075aed33fa03dab2ec9b3816e9c34f0946eebf44d451d9d79bb" } },
        time: { start: 1775960080650, end: 1775960081983 },
        id: "prt_d7f78410a001GAy2yZW1pYhDWv",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f783ad3001y2uDUqtosDpXfA",
      },
      {
        type: "tool",
        callID: "call_function_ftxa6txf13uy_1",
        tool: "edit",
        state: {
          status: "completed",
          input: { filePath: "/home/admin/deploy/cloudy/assistant/memory/2026-04-08.md", oldString: "- Web Speech API is the browser built-in API for speech recognition\n- No external services (like Whisper) needed", newString: "- Web Speech API is the browser built-in API for speech recognition\n- No external services (like Whisper) needed\n\n## Test\n- hello world" },
          output: "Edit applied successfully.",
          title: "home/admin/deploy/cloudy/assistant/memory/2026-04-08.md",
          metadata: { diagnostics: { "/home/admin/deploy/cloudy/docker-compose.yml": [] }, filepath: "/home/admin/deploy/cloudy/assistant/memory/2026-04-08.md", exists: false, truncated: false },
          time: { start: 1775960082591, end: 1775960082607 },
        },
        id: "prt_d7f784641001Jp5lzv9xIbyP4c",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f783ad3001y2uDUqtosDpXfA",
      },
      {
        type: "step-finish",
        reason: "tool-calls",
        cost: 0.00105654,
        tokens: { total: 13991, input: 121, output: 181, reasoning: 0, cache: { read: 13384, write: 305 } },
        id: "prt_d7f7848dd001YFUXCRry7LbkBP",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f783ad3001y2uDUqtosDpXfA",
      },
    ],
  },
  {
    info: {
      role: "assistant",
      time: { created: 1775960082663, completed: 1775960085490 },
      parentID: "msg_d7f77fceb001N4iTdBCL4YBPwZ",
      modelID: "minimax-m2.7",
      providerID: "opencode-go",
      mode: "build",
      agent: "build",
      path: { cwd: "/home/admin/deploy/cloudy/assistant", root: "/" },
      cost: 0.00098796,
      tokens: { total: 14130, input: 94, output: 120, reasoning: 0, cache: { read: 13596, write: 320 } },
      finish: "stop",
      id: "msg_d7f7848e7001lZokLqPesLhP06",
      sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
    },
    parts: [
      { type: "step-start", id: "prt_d7f784ecc0012NQ4I4QeAF6FM8", sessionID: "ses_28088b38bffeA99m5h9EomrL5l", messageID: "msg_d7f7848e7001lZokLqPesLhP06" },
      {
        type: "reasoning",
        text: "Both tasks are done:\n1. Added \"hello world\" to memory/2026-04-08.md - Done\n2. Created memory/2026-04-12.md - Done",
        metadata: { anthropic: { signature: "bee744ea68b1ad9975c76b15f36691a18607287d424ec4b708f1c5d93b4ba71b" } },
        time: { start: 1775960084176, end: 1775960085011 },
        id: "prt_d7f784ed0001N6sdujMEbBhp45",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f7848e7001lZokLqPesLhP06",
      },
      {
        type: "text",
        text: "เสร็จแล้วครับ:\n1. เพิ่ม `hello world` ลงใน `memory/2026-04-08.md` แล้ว\n2. สร้าง `memory/2026-04-12.md` ไว้แล้ว",
        time: { start: 1775960085416, end: 1775960085416 },
        id: "prt_d7f785215001uM09S8Kef0zEle",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f7848e7001lZokLqPesLhP06",
      },
      {
        type: "step-finish",
        reason: "stop",
        cost: 0.00098796,
        tokens: { total: 14130, input: 94, output: 120, reasoning: 0, cache: { read: 13596, write: 320 } },
        id: "prt_d7f7853eb0019xRNbDord2j0Rm",
        sessionID: "ses_28088b38bffeA99m5h9EomrL5l",
        messageID: "msg_d7f7848e7001lZokLqPesLhP06",
      },
    ],
  },
];

describe("traverseByParentId", () => {
  it("returns child assistant messages for a given parentId", () => {
    const parentId = "msg_d7f77fceb001N4iTdBCL4YBPwZ";
    const result = traverseByParentId(testMessages, parentId);

    expect(result).toHaveLength(7);
    expect(result.map((m) => m.info.id)).toEqual([
      "msg_d7f7848e7001lZokLqPesLhP06",
      "msg_d7f783ad3001y2uDUqtosDpXfA",
      "msg_d7f78311b001V0QhUoaeRd6fdV",
      "msg_d7f782472001PnRLMzLs4bimuW",
      "msg_d7f781d3d001FXrvMPLuApQxPd",
      "msg_d7f780e9b001GSRdWgAWKAKVdY",
      "msg_d7f77fdbd001C0HxwN0zTpHmsz",
    ]);
  });

  it("returns empty array when no children exist for parentId", () => {
    const parentId = "msg_d7f774c94001guJ6VIaI1KSSMm";
    const result = traverseByParentId(testMessages, parentId);

    expect(result).toHaveLength(0);
  });

  it("does not return user messages even if they match parentId", () => {
    const userMessageId = "msg_d7f77fceb001N4iTdBCL4YBPwZ";
    const result = traverseByParentId(testMessages, userMessageId);

    expect(result.every((m) => m.info.role === "assistant")).toBe(true);
  });

  it("returns messages in reverse order (newest first)", () => {
    const parentId = "msg_d7f77fceb001N4iTdBCL4YBPwZ";
    const result = traverseByParentId(testMessages, parentId);

    const createdTimes = result.map((m) => m.info.time.created);
    for (let i = 1; i < createdTimes.length; i++) {
      expect(createdTimes[i - 1]!).toBeGreaterThan(createdTimes[i]!);
    }
  });
});