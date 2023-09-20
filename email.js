document.addEventListener('DOMContentLoaded', function () {
  const getEmailButton = document.getElementById('getEmailButton');
  const copyAllButton = document.getElementById('copyAllEmailButton');
  const emailList = document.getElementById('emailList');
  const codeList = document.getElementById('codeList');
  let listAllEmail = ''
  copyAllButton.addEventListener('click', function(){
    copyToClipboard(listAllEmail);
  })

  // Thêm sự kiện click vào nút "Get Email"
  getEmailButton.addEventListener('click', function () {
    // Gọi hàm để lấy danh sách email ảo
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
            let intervalCode = setInterval(async () => {
              const [login, domain] = email.split('@');
              let idMessage = await getIdMessage(login, domain);

              const code = await getBodyMessage(login, domain, idMessage);
              if (code !== null) {
                codeItem.textContent = code;
                codeList.appendChild(codeItem);
                codeItem.addEventListener('click', async function () {
                  copyToClipboard(code);
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
  });
});

function getRandomEmails() {
  return fetch('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=15')
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