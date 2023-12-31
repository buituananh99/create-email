document.addEventListener('DOMContentLoaded', function () {
  const getEmailButton = document.getElementById('getEmailButton');
  const copyAllButton = document.getElementById('downloadListEmailButton');
  const inputNumEmail = document.getElementById('inputNumEmail');
  const emailList = document.getElementById('emailList');
  const codeList = document.getElementById('codeList');
  copyAllButton.addEventListener('click', function () {
    const data = new Blob([listAllEmail], { type: 'text/plain' });

    // Kiểm tra nếu trình duyệt hỗ trợ tính năng tạo đối tượng URL
    if (window.URL && window.URL.createObjectURL) {
      const blobURL = window.URL.createObjectURL(data);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobURL;
      downloadLink.download = 'emails.txt';
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(blobURL);
    } else {
      // Trình duyệt không hỗ trợ tính năng tạo đối tượng URL
      // Hiển thị nội dung email trong một cửa sổ hoặc thực hiện hành động tải xuống khác tùy bạn.
      alert('Trình duyệt không hỗ trợ tính năng tạo đối tượng URL.');
    }
  })

  runGetListEmail()

  // Thêm sự kiện click vào nút "Get Email"
  getEmailButton.addEventListener('click', function () {
    runGetListEmail()
  });

});

function runGetListEmail() {
  let listAllEmail = ''
  getRandomEmails()
    .then(data => {
      // Xóa danh sách email trước khi hiển thị
      emailList.innerHTML = '';
      codeList.innerHTML = '';

      data.forEach(email => {
        listAllEmail += email + '\n';
        // Tạo một phần tử danh sách và hiển thị email lên đó
        const listItem = document.createElement('li');
        listItem.textContent = email;
        emailList.appendChild(listItem);

        const codeItem = document.createElement('li');

        // Thêm sự kiện click vào mỗi mục email để sao chép email
        listItem.addEventListener('click', async function () {
          copyToClipboard(email);
          listItem.classList.add('currentCopy');
          let intervalCode = setInterval(async () => {
            const [login, domain] = email.split('@');
            let idMessage = await getIdMessage(login, domain);

            const code = await getBodyMessage(login, domain, idMessage);
            if (code !== null) {
              codeItem.textContent = code;
              codeList.appendChild(codeItem);
              codeItem.addEventListener('click', async function () {
                copyToClipboard(code);
                codeItem.classList.add('currentCopy');
              })
              clearInterval(intervalCode)
            } else {
              console.log('Không thể đọc email hoặc có lỗi.');
            }
          }, 2500)
        });
      });

    })
    .catch(error => {
      console.error('Lỗi:', error);
    });
}

function getRandomEmails() {
  // Kiểm tra xem có query parameter "n" hay không
  const urlParams = new URLSearchParams(window.location.search);
  const countParam = urlParams.get('n');

  // Thiết lập giá trị mặc định cho count
  let count = inputNumEmail.value

  if (count <= 0) {
    alert("Vui lòng nhập lớn hơn 0")
    return
  }

  // Nếu có query parameter "n", sử dụng giá trị từ query
  if (countParam !== null) {
    count = parseInt(countParam, 10);
  }
  return fetch(`https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=${count}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Không thể lấy danh sách email');
      }
      return response.json();
    })
    .catch(error => {
      throw error;
    });
}

function copyToClipboard(text) {
  const tempInput = document.createElement('input');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
}


async function getIdMessage(login, domain) {
  const apiUrl = `https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`;

  try {
    const response = await fetch(apiUrl);

    if (response.ok) {
      const data = await response.json();
      const messages = data;
      const firstMessage = messages[0];

      if (firstMessage) {
        return firstMessage.id;
      }
    } else {
      return null
    }
  } catch (error) {
    console.error('Đã xảy ra lỗi: ' + error.message);
    return null;
  }

  return null; // Trường hợp không có thư nào trong hộp thư
}

async function getBodyMessage(login, domain, id) {
  try {
    const apiUrl = `https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${id}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    const code = getMaXacMinh(data);
    return code;
  } catch (error) {
    console.error("Đã xảy ra lỗi: " + error);
    return null;
  }
}


function getMaXacMinh(noiDung) {
  // Sử dụng regex để tìm giá trị trong body
  var body = noiDung.body;
  var regex = /Your Verification Code：<a style='color: red;text-decoration: none'>(\d+)<\/a>/;
  var match = body.match(regex);

  // Kiểm tra nếu có kết quả và lấy giá trị
  if (match) {
    var verificationCode = match[1]; // Giá trị "1382" sẽ nằm ở group 1
    return verificationCode
  } else {
    console.log("Không tìm thấy mã xác minh trong body.");
    return ''
  }
}