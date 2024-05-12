# Nvim下混合编译调试Dreamplace源码


## 安装插件

- 前置需要安装NvChad

### 引入插件
```lua
    {
      lazy = false,
      &#34;rcarriga/nvim-dap-ui&#34;,
      dependencies = {
        {
          &#34;mfussenegger/nvim-dap&#34;,
          config = function()
            return require(&#34;custom.configs.dap.init&#34;)      Annotations specify that at most 0 return value(s) are required, found 1 to 2 returned here instead.
          end,
        },
      },
    },
```
### 配置插件
- C&#43;&#43;调试配置
```lua
-- c&#43;&#43;配置
-- file:dap/cppdbg.lua
local dap  = require(&#34;dap&#34;)
local function isempty(s)
        return s == nil or s == &#34;&#34;
end
dap.adapters.cppdbg = {
  id = &#39;cppdbg&#39;,
  type = &#39;executable&#39;,
  command = &#39;~/.local/share/nvim/mason/bin/OpenDebugAD7&#39;,
}
dap.configurations.cpp = {
  {
    name = &#34;Launch file&#34;,
    type = &#34;cppdbg&#34;,
    request = &#34;launch&#34;,
    program = function()
      return vim.fn.input(&#39;Path to executable: &#39;, vim.fn.getcwd() .. &#39;/&#39;, &#39;file&#39;)
    end,
    cwd = &#39;${workspaceFolder}&#39;,
    stopAtEntry = true,
  },
  {
    name = &#39;Attach to gdbserver :1234&#39;,
    type = &#39;cppdbg&#39;,
    request = &#39;launch&#39;,
    MIMode = &#39;gdb&#39;,
    miDebuggerServerAddress = &#39;localhost:1234&#39;,
    miDebuggerPath = &#39;/usr/bin/gdb&#39;,
    cwd = &#39;${workspaceFolder}&#39;,
    args = function()
      return {vim.fn.input(&#39;Parameters to executable: &#39;, vim.fn.getcwd() .. &#39;/&#39;, &#39;file&#39;)}
    end,
    program = function()
      return vim.fn.input(&#39;Path to executable: &#39;, vim.fn.getcwd() .. &#39;/&#39;, &#39;file&#39;)
    end,
  },
}
```

- 调试初始化
```lua
-- c&#43;&#43;配置
-- file:dap/init.lua
local dap, dapui = require(&#34;dap&#34;), require(&#34;dapui&#34;)

dapui.setup()

dap.listeners.after.event_initialized[&#34;dapui_config&#34;] = function()
  dapui.open()
end
dap.listeners.before.event_terminated[&#34;dapui_config&#34;] = function()
  dapui.close()
end
dap.listeners.before.event_exited[&#34;dapui_config&#34;] = function()
  dapui.close()
end

require(&#34;custom.configs.dap.cppdbg&#34;)
```
- 调试快捷键配置
```lua
M.Debug = {
  n = {
    [&#34;&lt;F5&gt;&#34;] = { &#39;:lua require(&#34;dap&#34;).continue()&lt;CR&gt;&#39;, &#34;debug: run/continue&#34; },
    [&#34;&lt;F7&gt;&#34;] = { &#39;:lua require(&#34;dap&#34;).toggle_breakpoint()&lt;CR&gt;&#39;, &#34;debug: toggle breakpoint&#34; },
    [&#34;&lt;F8&gt;&#34;] = { &#39;:lua require(&#34;dap&#34;).terminate() require(&#34;dapui&#34;).close()&lt;CR&gt;&#39;, &#34;debug: stop&#34; },
    [&#34;&lt;F9&gt;&#34;] = { &#39;:lua require(&#34;dap&#34;).step_into()&lt;CR&gt;&#39;, &#34;debug: step into&#34; },
    [&#34;&lt;F10&gt;&#34;] = { &#39;:lua require(&#34;dap&#34;).step_out()&lt;CR&gt;&#39;, &#34;debug: step out&#34; },
    [&#34;&lt;F11&gt;&#34;] = { &#39;:lua require(&#34;dap&#34;).step_over()&lt;CR&gt;&#39;, &#34;debug: step out&#34; },
    [&#34;&lt;leader&gt;db&#34;]= { &#39;:lua require(&#34;dap&#34;).set_breakpoint(vim.fn.input(&#34;Breakpoint condition: &#34;))&lt;CR&gt;&#39;, &#34;debug: Set breakpoint with condition&#34; },
    [&#34;&lt;leader&gt;dc&#34;]= { &#39;:lua require(&#34;dap&#34;).run_to_cursor()&lt;CR&gt;&#39;, &#34;debug: run to cursor&#34; },
    [&#34;&lt;leader&gt;dl&#34;]= { &#39;:lua require(&#34;dap&#34;).run_last()&lt;CR&gt;&#39;, &#34;debug: run last&#34; },
    [&#34;&lt;leader&gt;do&#34;]= { &#39;:lua require(&#34;dap&#34;).repl.open()&lt;CR&gt;&#39;, &#34;debug: open REPL&#34; },
  },
}
```


## 调试源码

### 启动GDBServer

```bash
gdbserver localhost:1234 ~/anaconda3/bin/python unittest/ops/lpabs_wirelength_unittest.py
```

### Neovim连接GDBServer

- 按F5进入调试运行模式，选2回车

![image.png](https://cdn.staticaly.com/gh/SivanLaai/image-store-rep@master/note/20230405192735.png)

- 输入运行参数回车

![image.png](https://cdn.staticaly.com/gh/SivanLaai/image-store-rep@master/note/20230405193133.png)


- 输入对应的python路径回车

![image.png](https://cdn.staticaly.com/gh/SivanLaai/image-store-rep@master/note/20230405193213.png)

### 调试界面

显示如下则成功进入调试模式：

![image.png](https://cdn.staticaly.com/gh/SivanLaai/image-store-rep@master/note/20230405194205.png)


---

> 作者:   
> URL: https://deembear.top/posts/technology/nvim_debug_mixed_cpp_python/  

