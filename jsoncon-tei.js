<script>
    let currentData = null;
    let currentJsonString = '';
    let toastInstance = null;

    // Initialize toast
    document.addEventListener('DOMContentLoaded', function() {
      const toastEl = document.getElementById('toast');
      toastInstance = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 2000
      });
    });

    function showToast(message, type = 'success') {
      const toast = document.getElementById('toast');
      const toastMessage = document.getElementById('toast-message');
      
      toastMessage.textContent = message;
      
      // Remove all background classes
      toast.classList.remove('bg-success', 'bg-danger', 'text-white');
      
      // Add appropriate background
      if (type === 'success') {
        toast.classList.add('bg-success', 'text-white');
      } else if (type === 'error') {
        toast.classList.add('bg-danger', 'text-white');
      }
      
      toastInstance.show();
    }

    function syntaxHighlight(json) {
      if (typeof json != 'string') {
        json = JSON.stringify(json, null, 2);
      }
      json = json
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return json.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g,
        function (match) {
          let cls = 'json-number';
          if (/^"/.test(match)) {
            cls = /:$/.test(match) ? 'json-key' : 'json-string';
          } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
          } else if (/null/.test(match)) {
            cls = 'json-null';
          }
          return `<span class="${cls}">${match}</span>`;
        }
      );
    }

    function getDataType(value) {
      if (value === null) return 'null';
      if (Array.isArray(value)) return 'array';
      return typeof value;
    }

    function createSimpleTree(data, level = 1, isLast = true, parentIsArray = false) {
      let html = '';
      
      if (typeof data === 'object' && data !== null) {
        const entries = Array.isArray(data) ? 
          data.map((item, index) => [`[${index}]`, item]) : 
          Object.entries(data);
        
        entries.forEach((entry, index) => {
          const [key, value] = entry;
          const isLastItem = index === entries.length - 1;
          const dataType = getDataType(value);
          
          html += `<div class="tree-node tree-level-${level} ${isLastItem ? 'last' : ''}">`;
          html += `<span class="node-key">${key}</span>`;
          html += `<span class="node-type type-${dataType}">${dataType}</span>`;
          
          if (dataType === 'array') {
            html += `<span class="array-info">[${value.length} รายการ]</span>`;
          } else if (dataType === 'object') {
            const objectSize = Object.keys(value).length;
            html += `<span class="array-info">{${objectSize} คีย์}</span>`;
          } else {
            const displayValue = JSON.stringify(value);
            const truncatedValue = displayValue.length > 50 ? displayValue.substring(0, 50) + '...' : displayValue;
            html += `<span class="node-value">: ${truncatedValue}</span>`;
          }
          
          html += `</div>`;
          
          if (dataType === 'object' || dataType === 'array') {
            html += createSimpleTree(value, level + 1, isLastItem, dataType === 'array');
          }
        });
      }
      
      return html;
    }

    function calculateStats(data) {
      const stats = {
        totalKeys: 0,
        totalArrays: 0,
        totalObjects: 0,
        totalValues: 0,
        maxDepth: 0
      };

      function traverse(obj, depth = 1) {
        stats.maxDepth = Math.max(stats.maxDepth, depth);
        
        if (Array.isArray(obj)) {
          stats.totalArrays++;
          obj.forEach(item => traverse(item, depth + 1));
        } else if (typeof obj === 'object' && obj !== null) {
          stats.totalObjects++;
          Object.entries(obj).forEach(([key, value]) => {
            stats.totalKeys++;
            if (typeof value === 'object' && value !== null) {
              traverse(value, depth + 1);
            } else {
              stats.totalValues++;
            }
          });
        } else {
          stats.totalValues++;
        }
      }

      traverse(data);
      return stats;
    }

    function displayStats(stats) {
      const statsContainer = document.getElementById('stats-container');
      const statsGrid = document.getElementById('stats-grid');
      
      statsGrid.innerHTML = `
        <div class="col-6 col-md">
          <div class="stat-card">
            <div class="stat-value">${stats.totalKeys}</div>
            <div class="stat-label">Keys</div>
          </div>
        </div>
        <div class="col-6 col-md">
          <div class="stat-card">
            <div class="stat-value">${stats.totalObjects}</div>
            <div class="stat-label">Objects</div>
          </div>
        </div>
        <div class="col-6 col-md">
          <div class="stat-card">
            <div class="stat-value">${stats.totalArrays}</div>
            <div class="stat-label">Arrays</div>
          </div>
        </div>
        <div class="col-6 col-md">
          <div class="stat-card">
            <div class="stat-value">${stats.totalValues}</div>
            <div class="stat-label">Values</div>
          </div>
        </div>
        <div class="col-6 col-md">
          <div class="stat-card">
            <div class="stat-value">${stats.maxDepth}</div>
            <div class="stat-label">Max Depth</div>
          </div>
        </div>
      `;
      
      statsContainer.style.display = 'block';
    }

    function parseJsonData() {
      const jsonInput = document.getElementById('json-input').value.trim();
      
      if (!jsonInput) {
        showToast('กรุณาใส่ข้อมูล JSON', 'error');
        return;
      }

      try {
        currentData = JSON.parse(jsonInput);
        currentJsonString = JSON.stringify(currentData, null, 2);
        
        // แสดง Tree
        const treeContent = document.getElementById('tree-content');
        treeContent.innerHTML = `
          <div class="tree-node root">
            <span class="node-key">📁 JSON Root</span>
            <span class="node-type type-${getDataType(currentData)}">${getDataType(currentData)}</span>
          </div>
          ${createSimpleTree(currentData)}
        `;
        
        // แสดง JSON
        const output = document.getElementById('output');
        output.innerHTML = syntaxHighlight(currentJsonString);
        
        // คำนวณสถิติ
        const stats = calculateStats(currentData);
        displayStats(stats);
        
        // แสดง sections
        document.getElementById('tree-view').style.display = 'block';
        document.getElementById('json-output').style.display = 'block';
        document.getElementById('download-json').style.display = 'inline-block';
        document.getElementById('copy-json').style.display = 'inline-block';
        
        showToast('แปลง JSON สำเร็จ!', 'success');
        
        // Scroll to tree view
        document.getElementById('tree-view').scrollIntoView({ behavior: 'smooth', block: 'start' });
        
      } catch (error) {
        showToast('รูปแบบ JSON ไม่ถูกต้อง: ' + error.message, 'error');
      }
    }

    // Event Listeners
    document.getElementById('input-excel').addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet);
          
          document.getElementById('json-input').value = JSON.stringify(json, null, 2);
          parseJsonData();
        } catch (error) {
          showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    });

    document.getElementById('parse-json').addEventListener('click', parseJsonData);

    document.getElementById('download-json').addEventListener('click', () => {
      if (!currentJsonString) return;
      
      const blob = new Blob([currentJsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('ดาวน์โหลด JSON สำเร็จ!', 'success');
    });

    document.getElementById('copy-json').addEventListener('click', () => {
      if (!currentJsonString) return;
      
      navigator.clipboard.writeText(currentJsonString).then(() => {
        showToast('คัดลอก JSON สำเร็จ!', 'success');
      }).catch(() => {
        showToast('ไม่สามารถคัดลอกได้', 'error');
      });
    });

    // Handle collapse icon rotation
    document.addEventListener('DOMContentLoaded', function() {
      const collapseElements = document.querySelectorAll('.collapse');
      
      collapseElements.forEach(function(collapseEl) {
        collapseEl.addEventListener('show.bs.collapse', function() {
          const header = document.querySelector(`[data-bs-target="#${collapseEl.id}"]`);
          if (header) {
            const icon = header.querySelector('.collapse-icon');
            if (icon) icon.classList.remove('collapsed');
          }
        });
        
        collapseEl.addEventListener('hide.bs.collapse', function() {
          const header = document.querySelector(`[data-bs-target="#${collapseEl.id}"]`);
          if (header) {
            const icon = header.querySelector('.collapse-icon');
            if (icon) icon.classList.add('collapsed');
          }
        });
      });
    });
  </script>
     <script>
    const backToTop = document.getElementById("backToTop");

    window.addEventListener("scroll", () => {
      if (window.scrollY > 200) {
        backToTop.classList.add("show");
      } else {
        backToTop.classList.remove("show");
      }
    });

    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  </script>