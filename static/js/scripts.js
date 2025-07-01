// 로그인한 사용자의 ID를 저장하는 변수입니다.
const userId = "user1";

// 페이지 로딩 시, 기존 데이터베이스(DB)에서 데이터를 불러옵니다.
loadAllData();

// 각 채팅 컨테이너(질문별 채팅창)를 저장하는 객체입니다.
const chatContainers = {};

// 소개 요소(처음 시작할 때 표시되는 화면)를 저장하는 변수입니다.
const introElement = document.querySelector('.intro');

// AJAX 요청의 결과를 저장하는 변수입니다. 기본적으로 false로 설정됩니다.
let ajaxResult = false;

// 전체 데이터 불러오기
// 데이터베이스에서 로그인한 사용자의 데이터를 모두 불러오는 함수입니다.
async function loadAllData() {
    // 데이터베이스에서 사용할 사용자 ID를 JSON 형식으로 변환합니다.
    let selectJsonData = {
        'userId': userId
    };
    let selectJsonDataString = JSON.stringify(selectJsonData);

    try {
        // 모든 데이터를 불러오는 AJAX 요청을 비동기적으로 실행하고, 그 결과를 dataArray 변수에 저장합니다.
        const dataArray = await ajaxLoadAllData(selectJsonDataString);
        // 불러온 데이터 배열(dataArray)을 기반으로 질문 탭과 채팅창을 생성합니다.
        createQuestionsAndChats(dataArray);
    } catch (error) {
        // 데이터 불러오기에 실패했을 때, 콘솔에 에러 메시지를 출력합니다.
        console.error("Failed to load data:", error);
    }
}

// 질문 탭과 채팅창 HTML 생성 및 추가
// 불러온 데이터 배열을 기반으로 질문 목록과 각 질문에 대응하는 채팅창을 생성하는 함수입니다.
function createQuestionsAndChats(dataArray) {
    // 질문 목록을 표시할 요소를 가져옵니다.
    const questionsList = document.getElementById('questionsList');

    // 데이터 배열의 각 항목에 대해 반복합니다.
    dataArray.forEach(function (data) {
        // 각 질문의 고유 식별자(HTML 요소의 ID)를 생성합니다.
        const questionDataId = data.dataId;

        // 질문 항목을 담을 div 요소를 생성하고, 클래스 및 데이터 속성을 설정합니다.
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';
        questionItem.setAttribute('data-id', questionDataId);
        // 불러온 질문 HTML을 설정합니다.
        questionItem.innerHTML = data.questionHtml;
        // 질문 목록에 질문 항목을 추가합니다.
        questionsList.appendChild(questionItem);

        // 질문 항목을 클릭했을 때 해당 질문에 대응하는 채팅창으로 전환하도록 이벤트 핸들러를 설정합니다.
        questionItem.addEventListener('click', function () {
            switchChatContainer(questionDataId);
        });

        // 메인 콘텐츠 영역(채팅창을 표시할 영역)을 가져옵니다.
        const mainContent = document.getElementById('mainContent');

        // 각 질문에 대응하는 채팅창 div 요소를 생성하고, 클래스 및 ID를 설정합니다.
        const chatContainer = document.createElement('div');
        chatContainer.className = 'chat-container';
        chatContainer.id = questionDataId;
        // 불러온 채팅창 HTML을 설정합니다.
        chatContainer.innerHTML = data.chatHtml;
        // 메인 콘텐츠 영역에 채팅창을 추가합니다.
        mainContent.appendChild(chatContainer);

        // 채팅창을 chatContainers 객체에 저장합니다.
        chatContainers[questionDataId] = chatContainer;
        // 질문 항목 클릭 시 해당 채팅창으로 전환합니다.
        switchChatContainer(questionDataId);

        // 채팅창 내부의 채팅 메시지 영역을 가져옵니다.
        const chatBody = chatContainer.querySelector('.chat-body');
        // 불러온 메시지 목록을 가져옵니다.
        const messages = Array.isArray(data.messages)
            ? data.messages
            : [];

        // 각 메시지에 대해 반복하면서 채팅 메시지 div 요소를 생성하여 채팅창에 추가합니다.
        messages.forEach(function (message) {
            const messageDiv = document.createElement('div');
            // 메시지의 타입(bot 또는 user)에 따라 클래스 이름을 설정합니다.
            messageDiv.className = 'chat-message ' + (
                message.type === 'bot'
                    ? 'bot'
                    : 'user'
            );
            messageDiv.innerHTML = message.text;
            chatBody.appendChild(messageDiv);
        });
    });

    // 일기 내용을 표시하는 함수를 호출합니다.
    openDiaryContent();
}

// 질문 생성 버튼 클릭 시 호출되는 함수
// 새로운 질문 항목과 해당 채팅창을 생성하는 함수입니다.
async function createNewQuestion() {
    // 현재 시간을 기반으로 고유 ID를 생성합니다.
    const id = Date.now();
    const questionDataId = 'question-' + userId + "-" + id;

    // 질문 목록을 가져옵니다.
    const questionsList = document.getElementById('questionsList');

    // 새로운 질문 항목을 담을 div 요소를 생성하고, 클래스 및 데이터 속성을 설정합니다.
    const questionItem = document.createElement('div');
    questionItem.className = 'question-item';
    questionItem.setAttribute('data-id', questionDataId);

    // 현재 질문 항목의 인덱스(순서)를 구합니다.
    const questionItems = Array.from(
        questionsList.querySelectorAll('.question-item')
    );
    let index = questionItems.length + 1;

    // 새로운 질문 항목의 HTML 내용을 설정합니다.
    // questionItem.innerHTML = '<span>질문 ' + index + '</span> <button class="ellipsis' +
    //         '-button" onclick="togglePopupMenu(this)">···</button><div class="popup-menu"><' +
    //         'button onclick="editQuestion(this)">이름 바꾸기</button><button onclick="toggleLear' +
    //         'ningMenu(this)">학습</button><button onclick="deleteQuestion(this)">삭제</button><' +
    //         'button onclick="selectQuestionItem(this)">이동</button></div>';

    questionItem.innerHTML = '<span>질문 ' + index + '</span> <button class="ellipsis' +
            '-button" onclick="togglePopupMenu(this)">···</button><div class="popup-menu"><' +
            'button onclick="editQuestion(this)">이름 바꾸기</button><button onclick="deleteQuestion(this)">삭제</button>';    

    // 질문 항목 추가 및 이벤트 핸들러 설정
    if (index <= 10) { // 질문 항목이 10개 이하일 때만 추가합니다.
        // 질문 항목 클릭 시 해당 채팅 컨테이너로 전환하는 이벤트 핸들러를 추가합니다.
        questionItem.addEventListener('click', function () {
            switchChatContainer(questionDataId);
        });

        // 데이터베이스에 새로운 질문 항목을 추가하기 위한 AJAX 요청 데이터를 준비합니다.
        let insertJsonData = {
            'userId': userId,
            'roomIndex': index,
            'dataId': questionDataId,
            'questionHtml': questionItem.innerHTML
        };
        console.log(insertJsonData);
        let insertJsonDataString = JSON.stringify(insertJsonData);

        try {
            // AJAX 요청이 성공하면 질문 항목을 질문 목록에 추가합니다.
            const ajaxResult = await ajaxInsertQuestionItem(insertJsonDataString);
            if (ajaxResult) {
                questionsList.appendChild(questionItem);
            } else {
                console.log("질문 HTML 요소 추가에 실패하였습니다.");
            }

            // 비동기 작업 후, 새로운 채팅 컨테이너를 생성하고 추가합니다.
            const chatContainer = await createChatContainer(questionDataId, index);
            // chatContainer를 chatContainers 객체에 추가합니다.
            chatContainers[questionDataId] = chatContainer;
            // 새로운 질문에 해당하는 채팅 컨테이너로 전환합니다.
            switchChatContainer(questionDataId);
        } catch (error) {
            // AJAX 요청 중 오류가 발생한 경우, 콘솔에 에러 메시지를 출력합니다.
            console.error("AJAX 요청 중 오류 발생:", error);
        }
    }
}

// 채팅 컨테이너를 생성하는 함수
// 질문에 대응하는 새로운 채팅 컨테이너를 생성합니다.
async function createChatContainer(id, index) {
    // 메인 콘텐츠 영역을 가져옵니다.
    const mainContent = document.getElementById('mainContent');

    // 새로운 채팅 컨테이너 div 요소를 생성하고, 클래스 및 ID를 설정합니다.
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    chatContainer.id = id;
    // 기본적인 채팅창 구조(HTML)을 설정합니다.
    chatContainer.innerHTML = '<div class="chat-body"></div><div class="chat-footer"><textarea id="user-quest' +
            'ion" placeholder="추억을 적어주세요..." onkeypress="handleKeyPress(event, \'' + id + '\')"></textarea><button id="btn-send-message" onclick="sendMessage(\'' +
            id + '\')"><img src="https://img.icons8.com/ios-filled/50/ffffff/paper-plane.pn' +
            'g" alt="Send"></button></div><div class="announcement">Chat JAO는 실수를 하지 않습니다.</div>';

    // 데이터베이스에 새로운 채팅 컨테이너(질문 방)를 추가하기 위한 AJAX 요청 데이터를 준비합니다.
    let insertJsonData = {
        'userId': userId,
        'roomIndex': index,
        'chatHtml': chatContainer.innerHTML
    };
    let insertJsonDataString = JSON.stringify(insertJsonData);

    try {
        // AJAX 요청이 성공하면 메인 콘텐츠 영역에 채팅 컨테이너를 추가합니다.
        const ajaxResult = await ajaxUpdateChatContainer(insertJsonDataString);
        if (ajaxResult) {
            mainContent.appendChild(chatContainer);
        } else {
            console.log("채팅방 HTML 요소 추가에 실패하였습니다.");
        }
    } catch (error) {
        // AJAX 요청 중 오류가 발생한 경우, 콘솔에 에러 메시지를 출력합니다.
        console.error("AJAX 요청 중 오류 발생:", error);
    }

    // 생성된 채팅 컨테이너를 반환합니다.
    return chatContainer;
}

// 질문 전송
// 사용자가 채팅 메시지를 입력하고 전송하는 함수입니다.
async function sendMessage(id) {
    // 현재 활성화된 채팅 컨테이너를 가져옵니다.
    const chatContainer = document.getElementById(id);
    const chatContainers = document.querySelectorAll('.chat-container');
    const chatArray = Array.from(chatContainers);
    // 현재 채팅창의 인덱스를 구합니다.
    const roomIndex = chatArray.indexOf(chatContainer) + 1;
    // console.log("Room Index: " + roomIndex);

    // 사용자가 입력한 질문(메시지)을 가져옵니다.
    const userQuestion = chatContainer
        .querySelector('textarea')
        .value;
    // HTML 태그가 포함된 특수 문자를 이스케이프 처리하여 안전하게 변환합니다.
    const safeUserQuestion = escapeHtml(userQuestion);

    // 사용자가 입력한 질문이 비어 있지 않은 경우에만 메시지를 전송합니다.
    if (safeUserQuestion.trim() !== '') {
        // 유저 메세지의 인덱스를 구합니다.
        const userMessages = chatContainer.querySelectorAll('.chat-message.user');
        let userMessageIndex = userMessages.length + 1;
        // console.log("User message index: " + userMessageIndex);

        // 사용자 질문을 HTML로 생성합니다.
        const userQuestionHTML = '<span>' + safeUserQuestion + '</span><img class="icon' +
                '" src="https://img.icons8.com/ios-glyphs/30/000000/user.png" alt="User">';

        // 사용자 질문을 데이터베이스에 저장하기 위한 AJAX 요청 데이터를 준비합니다.
        let insertUserJsonData = {
            'dataId': id,
            'userId': userId,
            'roomIndex': roomIndex,
            'messageIndex': userMessageIndex,
            'userQuestion': userQuestionHTML
        };
        let insertUserJsonDataString = JSON.stringify(insertUserJsonData);

        try {
            // AJAX 요청이 성공하면 사용자 질문을 채팅창에 추가합니다.
            const ajaxResult = await ajaxInsertUserQuestion(insertUserJsonDataString);
            if (ajaxResult) {
                // 사용자 질문을 채팅창에 HTML로 추가합니다.
                let userMessageHTML = document.createElement('div');
                userMessageHTML.className = 'chat-message user';
                userMessageHTML.innerHTML = userQuestionHTML;
                chatContainer
                    .querySelector('.chat-body')
                    .appendChild(userMessageHTML);
                // 질문 입력란을 비웁니다.
                chatContainer
                    .querySelector('textarea')
                    .value = '';
                // 채팅창을 스크롤하여 새 메시지가 보이도록 합니다.
                chatContainer
                    .querySelector('.chat-body')
                    .scrollTop = chatContainer
                    .querySelector('.chat-body')
                    .scrollHeight;

                // 데이터 전처리 작업을 위한 AJAX 요청 데이터를 준비합니다.
                let requestJsonPreProcessingData = {
                    'userId': userId,
                    'dataId': id,
                    'roomId': roomIndex,
                    'userMessage': safeUserQuestion
                };
                let requestJsonPreProcessingDataString = JSON.stringify(
                    requestJsonPreProcessingData
                );

                try {
                    // 데이터 전처리 작업을 위한 AJAX 요청을 비동기적으로 실행합니다.
                    const ajaxResult = await ajaxPreProcessingData(
                        requestJsonPreProcessingDataString
                    );
                    if (ajaxResult) {
                        // 봇 메세지 HTML을 생성하고 추가합니다.
                        let botAnswerHTML = document.createElement('div');
                        botAnswerHTML.className = 'chat-message bot';

                        // 데이터 전처리된 키워드의 HTML을 생성합니다.
                        let keywordContent = '';
                        let uniqueIndex = 0;
                        if (ajaxResult.body.length > 0 && ajaxResult.body[0].keyword && ajaxResult.body[0].keyword.length > 0) {
                            let uniqueBaseIndex = Date.now();
                            const keywords = ajaxResult.body[0].keyword;

                            keywords.forEach(function (keyword, index) {
                                if (keyword.trim() !== '') {
                                    uniqueIndex = uniqueBaseIndex++;
                                    const isLast = index === keywords.length - 1;
                                    keywordContent += '<span><em>' + keyword + (isLast ? '' : ',') + '</em></span>';

                                    // 삭제 버튼 기능 복구 시 아래 주석을 사용할 수 있습니다:
                                    /*
                                    keywordContent += '<span><em>' + keyword +
                                        '</em> <button class="delete-keyword-btn" data-index="' + uniqueIndex + '" onclick="deleteKeyword(this)">삭제</button></span>';
                                    */
                                }
                            });
                        } else {
                            keywordContent = '키워드 없음<br>';
                        }

                        // 봇의 응답 메시지를 HTML로 생성합니다.
                        let botMessageHTML = '<img class="icon" src="https://img.icons8.com/ios-glyphs/30/000000/chatbot.png' +
                                '" alt="Bot"><span>';

                        if (keywordContent.trim() === '' || keywordContent === '키워드 없음<br>') {
                            botMessageHTML += '입력하신 검색어에 해당하는 키워드를 찾을 수 없습니다. 다시 시도해 주세요.<br>';
                        } else {
                            botMessageHTML += '해당 키워드로 검색한 결과입니다. [' + keywordContent + ']<br><br>';

                            // 검색 결과가 없거나 하나인 경우를 처리합니다.
                            if (ajaxResult.body.length == 1 && !ajaxResult.body[0].diaryTitle) {
                                botMessageHTML += '검색 결과가 없습니다. 불필요한 키워드들을 삭제해서 검색 정확도를 높이세요.';
                            } else if (ajaxResult.body.length == 1) {
                                botMessageHTML += '<strong>제목: </strong>' + ajaxResult
                                    .body[0]
                                    .diaryTitle + '<br><strong>날짜: </strong>' + ajaxResult
                                    .body[0]
                                    .writeDate + '<br><strong>내용: </strong>' + ajaxResult
                                    .body[0]
                                    .diaryContent;
                            } else if (ajaxResult.body.length > 1) {
                                ajaxResult
                                    .body
                                    .forEach(function (diary) {
                                        uniqueIndex++;
                                        botMessageHTML += '<div class="diary-entry"><strong>제목: </strong>' + diary.diaryTitle + '   <stro' +
                                                'ng>날짜: </strong>' + diary.writeDate + '<br><button class="toggle-content-btn" ' +
                                                'data-index="' + uniqueIndex + '">내용 보기</button><div class="diary-content" id="' +
                                                'diary-content-' + uniqueIndex + '" style="display: none;">' + diary.diaryContent +
                                                '</div></div>';
                                    });
                            }
                        }

                        botMessageHTML += '</span>';
                        botAnswerHTML.innerHTML = botMessageHTML;
                        const chatBody = chatContainer.querySelector('.chat-body');
                        chatBody.appendChild(botAnswerHTML);
                        // 새로운 봇 메시지가 보이도록 스크롤을 조정합니다.
                        chatBody.scrollTo({top: chatBody.scrollHeight, behavior: 'smooth'});

                        const botMessages = chatContainer.querySelectorAll('.chat-message.bot');
                        const botMessageIndex = Array
                            .from(botMessages)
                            .indexOf(botAnswerHTML) + 1;
                        // console.log("Bot message index: " + botMessageIndex);

                        // 봇의 응답 메시지를 데이터베이스에 저장하기 위한 AJAX 요청 데이터를 준비합니다.
                        let insertBotJsonData = {
                            'dataId': id,
                            'userId': userId,
                            'roomIndex': roomIndex,
                            'messageIndex': botMessageIndex,
                            'botAnswer': botAnswerHTML.innerHTML
                        };
                        let insertBotJsonDataString = JSON.stringify(insertBotJsonData);

                        try {
                            // 봇의 응답 메시지를 데이터베이스에 저장하는 AJAX 요청을 실행합니다.
                            const ajaxResultBot = await ajaxInsertBotAnswer(insertBotJsonDataString);
                            if (ajaxResultBot) {
                                // console.log("봇 대답 HTML 요소 추가에 성공하였습니다.");
                            } else {
                                console.log("봇 대답 HTML 요소 추가에 실패하였습니다.");
                            }
                        } catch (error) {
                            console.error("봇 대답 AJAX 요청 중 오류 발생:", error);
                        }
                    } else {
                        console.log("데이터 전처리에 실패하였습니다.");
                    }
                } catch (error) {
                    console.error("AJAX 요청 중 오류 발생:", error);
                }

                // 일기 내용을 다시 로드하는 함수를 호출합니다.
                openDiaryContent();
            } else {
                console.log("사용자 질문 HTML 요소 추가에 실패하였습니다.");
            }
        } catch (error) {
            console.error("사용자 질문 AJAX 요청 중 오류 발생:", error);
        }
    }
}

// 채팅 컨테이너를 전환하는 함수
// 사용자가 선택한 질문에 대응하는 채팅창으로 화면을 전환하는 함수입니다.
function switchChatContainer(id) {
    // 모든 채팅 컨테이너를 숨깁니다.
    document
        .querySelectorAll('.chat-container')
        .forEach(container => {
            container.style.display = 'none';
        });

    // 소개 요소(초기 화면)을 숨깁니다.
    if (introElement && document.querySelectorAll('.question-item').length > 0) {
        introElement.style.display = 'none';
    }

    // 모든 질문 항목의 활성화 상태를 해제합니다.
    document
        .querySelectorAll('.question-item')
        .forEach(item => {
            item
                .classList
                .remove('active');
        });

    // 선택된 채팅 컨테이너를 표시하고 활성화 상태로 설정합니다.
    const chatContainer = chatContainers[id];
    if (chatContainer) {
        chatContainer.style.display = 'flex';
        const chatBody = chatContainer.querySelector('.chat-body');
        // 채팅창을 스크롤하여 새 메시지가 보이도록 합니다.
        chatBody.scrollTo({top: chatBody.scrollHeight, behavior: 'smooth'});
    }

    // 선택된 질문 항목을 활성화 상태로 설정합니다.
    const questionItem = document.querySelector(
        '.question-item[data-id="' + id + '"]'
    );
    if (questionItem) {
        questionItem
            .classList
            .add('active');
    }
}

// 일기 내용을 확인하는 함수
// 각 일기 내용의 표시/숨기기 버튼을 처리하는 함수입니다.
function openDiaryContent() {
    // "내용 보기" 또는 "내용 숨기기" 버튼을 모두 선택합니다.
    var toggleButtons = document.querySelectorAll('.toggle-content-btn');
    toggleButtons.forEach(function (button) {
        // 기존 버튼을 복제하여 기존 이벤트를 제거합니다.
        var clone = button.cloneNode(true);
        button
            .parentNode
            .replaceChild(clone, button);
    });

    // 새로 복제한 버튼들에 대해 클릭 이벤트 핸들러를 설정합니다.
    var newToggleButtons = document.querySelectorAll('.toggle-content-btn');
    newToggleButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            // 버튼의 data-index 속성 값을 가져옵니다.
            var index = button.getAttribute('data-index');
            // 해당 인덱스에 대응하는 일기 내용을 표시하거나 숨깁니다.
            var contentDiv = document.getElementById('diary-content-' + index);
            if (contentDiv.style.display === 'none') {
                contentDiv.style.display = 'block';
                button.textContent = '내용 숨기기';
                // 일기 내용이 보이도록 스크롤을 조정합니다.
                contentDiv.scrollIntoView({behavior: 'smooth', block: 'nearest'});
                window.scrollBy(0, -1000);
            } else {
                contentDiv.style.display = 'none';
                button.textContent = '내용 보기';
            }
        });
    });
}

// 키워드 삭제 함수
// 봇의 응답 메시지에서 특정 키워드를 삭제하는 함수입니다.
async function deleteKeyword(button) {
    // 삭제할 키워드의 고유 인덱스를 가져옵니다.
    const dataIndex = button.getAttribute('data-index');
    // console.log(dataIndex);
    let chatContainer = button.closest('.chat-container');
    // console.log(chatContainer);
    // 삭제할 키워드가 속한 채팅 컨테이너의 ID를 가져옵니다.
    const dataId = chatContainer.id;
    // console.log(dataId);
    // 삭제할 키워드가 포함된 봇의 메시지를 가져옵니다.
    let chatMessageBot = button.closest('.chat-message.bot');
    // console.log(chatMessageBot);
    // 삭제할 키워드가 포함된 <span> 요소를 가져옵니다.
    let spanElement = button.closest('span');
    // console.log(spanElement);
    let keyword = '';
    if (spanElement) {
        // <span> 내의 <em> 요소를 찾아서 키워드를 가져옵니다.
        let emElement = spanElement.querySelector('em');
        if (emElement) {
            keyword = emElement.textContent;
            // console.log(keyword);
        }
    }
    const chatBody = chatMessageBot.closest('.chat-body');
    // console.log(chatBody);
    // 해당 채팅창 내의 모든 봇 메시지를 배열로 만듭니다.
    const botMessageArray = Array
        .prototype
        .filter
        .call(chatBody.children, function (botMessage) {
            return botMessage
                .classList
                .contains('bot');
        });
    // 메시지의 인덱스를 구합니다.
    const messageIndex = botMessageArray.indexOf(chatMessageBot) + 1;
    // console.log("Message Index: " + messageIndex);
    const chatContainers = document.querySelectorAll('.chat-container');
    const chatArray = Array.from(chatContainers);
    // 채팅창의 인덱스를 구합니다.
    const roomIndex = chatArray.indexOf(chatContainer) + 1;
    // console.log("Room Index: " + roomIndex);

    // 제외할 키워드를 데이터베이스에 저장하기 위한 AJAX 요청 데이터를 준비합니다.
    let insertJsonData = {
        'userId': userId,
        'roomId': roomIndex,
        'dataId': dataId,
        'dataIndex': dataIndex,
        'messageIndex': messageIndex,
        'excludedKeyword': keyword
    };
    let insertJsonDataString = JSON.stringify(insertJsonData);

    try {
        // AJAX 요청이 성공하면 다음 단계를 실행합니다.
        const ajaxResult = await ajaxInsertExcludedKeyword(insertJsonDataString);
        if (ajaxResult) {
            // 삭제된 키워드에 해당하는 사용자 질문을 추출합니다.
            const chatMessageUser = chatMessageBot.previousElementSibling;
            // console.log("chatMessageUser: " + chatMessageUser);
            const userQuestionElement = chatMessageUser.querySelector('span');
            const userQuestion = userQuestionElement.textContent;
            // console.log("userQuestion: " + userQuestion);

            // 재검색 함수 호출
            insertJsonData.userQuestion = userQuestion;
            sendAgainMessage(insertJsonData, chatMessageBot);
            // 학습 탭 내부 키워드를 추가합니다.
            const questionList = document.querySelector('.questions-list');
            // console.log(questionList);
        }
    } catch (error) {
        console.error("AJAX 요청 중 오류 발생:", error);
    }
}

// 재검색 함수
// 사용자가 특정 키워드를 삭제한 후, 다시 검색하여 결과를 업데이트하는 함수입니다.
async function sendAgainMessage(data, chatMessageBot) {
    const chatContainer = document.getElementById(data.dataId);
    // console.log(chatContainer);
    const chatContainers = document.querySelectorAll('.chat-container');
    const chatArray = Array.from(chatContainers);

    // 데이터 전처리 작업을 위한 AJAX 요청 데이터를 준비합니다.
    let requestJsonPreProcessingData = {
        'dataId': data.dataId,
        'roomId': data.roomId,
        'userMessage': data.userQuestion
    };
    let requestJsonPreProcessingDataString = JSON.stringify(
        requestJsonPreProcessingData
    );

    try {
        // 데이터 전처리 작업을 위한 AJAX 요청을 비동기적으로 실행합니다.
        const ajaxResult = await ajaxPreProcessingData(
            requestJsonPreProcessingDataString
        );
        if (ajaxResult) {
            // 봇 메세지 HTML을 생성하고 추가합니다.
            let botAnswerHTML = document.createElement('div');
            botAnswerHTML.className = 'chat-message bot';

            // 데이터 전처리된 키워드의 HTML을 생성합니다.
            let keywordContent = '';
            let uniqueIndex = 0;
            if (ajaxResult.body.length > 0 && ajaxResult.body[0].keyword && ajaxResult.body[0].keyword.length > 0) {
                let uniqueBaseIndex = Date.now();
                const keywords = ajaxResult.body[0].keyword;

                keywords.forEach(function (keyword, index) {
                    if (keyword.trim() !== '') {
                        uniqueIndex = uniqueBaseIndex++;
                        const isLast = index === keywords.length - 1;
                        keywordContent += '<span><em>' + keyword + (isLast ? '' : ',') + '</em></span>';

                        // 삭제 버튼 기능 복구 시 아래 주석을 사용할 수 있습니다:
                        /*
                        keywordContent += '<span><em>' + keyword +
                            '</em> <button class="delete-keyword-btn" data-index="' + uniqueIndex + '" onclick="deleteKeyword(this)">삭제</button></span>';
                        */
                    }
                });
            } else {
                keywordContent = '키워드 없음<br>';
            }

            // 봇의 응답 메시지를 HTML로 생성합니다.
            let botMessageHTML = '<img class="icon" src="https://img.icons8.com/ios-glyphs/30/000000/chatbot.png' +
                    '" alt="Bot"><span>';

            if (keywordContent.trim() === '' || keywordContent === '키워드 없음<br>') {
                botMessageHTML += '입력하신 검색어에 해당하는 키워드를 찾을 수 없습니다. 다시 시도해 주세요.<br>';
            } else {
                botMessageHTML += '해당 키워드로 검색한 결과입니다. [' + keywordContent + ']<br><br>';

                // 검색 결과가 없거나 하나인 경우를 처리합니다.
                if (ajaxResult.body.length == 1 && !ajaxResult.body[0].diaryTitle) {
                    botMessageHTML += '검색 결과가 없습니다. 불필요한 키워드들을 삭제해서 검색 정확도를 높이세요.';
                } else if (ajaxResult.body.length == 1) {
                    botMessageHTML += '<strong>제목: </strong>' + ajaxResult
                        .body[0]
                        .diaryTitle + '<br><strong>날짜: </strong>' + ajaxResult
                        .body[0]
                        .writeDate + '<br><strong>내용: </strong>' + ajaxResult
                        .body[0]
                        .diaryContent;
                } else if (ajaxResult.body.length > 1) {
                    ajaxResult
                        .body
                        .forEach(function (diary) {
                            uniqueIndex++;
                            botMessageHTML += '<div class="diary-entry"><strong>제목: </strong>' + diary.diaryTitle + '   <stro' +
                                    'ng>날짜: </strong>' + diary.writeDate + '<br><button class="toggle-content-btn" ' +
                                    'data-index="' + uniqueIndex + '">내용 보기</button><div class="diary-content" id="' +
                                    'diary-content-' + uniqueIndex + '" style="display: none;">' + diary.diaryContent +
                                    '</div></div>';
                        });
                }
            }

            botMessageHTML += '</span>';
            botAnswerHTML.innerHTML = botMessageHTML;
            // 기존 봇 메시지에 새로운 내용을 덮어씁니다.
            chatMessageBot.innerHTML = botAnswerHTML.innerHTML;
            // console.log(chatMessageBot.innerHTML);

            const chatBody = chatContainer.querySelector('.chat-body');
            // 새로운 봇 메시지가 보이도록 스크롤을 조정합니다.
            chatBody.scrollTo({top: chatBody.scrollHeight, behavior: 'smooth'});

            // 봇의 응답 메시지를 데이터베이스에 업데이트하기 위한 AJAX 요청 데이터를 준비합니다.
            let updateBotJsonData = {
                'dataId': data.dataId,
                'userId': userId,
                'roomIndex': data.roomId,
                'messageIndex': data.messageIndex,
                'botAnswer': chatMessageBot.innerHTML
            };
            let updateBotJsonDataString = JSON.stringify(updateBotJsonData);

            try {
                // 봇의 응답 메시지를 데이터베이스에 업데이트하는 AJAX 요청을 실행합니다.
                const ajaxResultBot = await ajaxUpdateBotAnswer(updateBotJsonDataString);
                if (ajaxResultBot) {
                    // console.log("봇 대답 HTML 요소 추가에 성공하였습니다.");
                } else {
                    console.log("봇 대답 HTML 요소 추가에 실패하였습니다.");
                }
            } catch (error) {
                console.error("봇 대답 AJAX 요청 중 오류 발생:", error);
            }
        } else {
            console.log("데이터 전처리에 실패하였습니다.");
        }

        // 일기 내용을 다시 로드하는 함수를 호출합니다.
        openDiaryContent();
    } catch (error) {
        console.error("AJAX 요청 중 오류 발생:", error);
    }
}

// 질문 삭제 함수
// 사용자가 특정 질문을 삭제할 때 호출되는 함수입니다.
async function deleteQuestion(button) {
    // 질문 항목 전체를 감싸는 요소를 가져옵니다.
    const questionList = button.closest('.questions-list');
    // console.log(questionList);
    const questionItem = button.closest('.question-item');
    // 질문창의 인덱스를 구합니다.
    const questionItems = questionList.querySelectorAll('.question-item');
    const questionItemArray = Array.from(questionItems);
    const roomIndex = questionItemArray.indexOf(questionItem) + 1;
    // console.log("Room Index: " + roomIndex);

    // 삭제할 질문 항목의 data-id 속성 값을 가져옵니다.
    const questionItemDataId = questionItem.getAttribute("data-id");

    // 메인 콘텐츠 영역을 가져옵니다.
    const mainContent = document.getElementById('mainContent');

    // data-id에 해당하는 채팅 컨테이너를 가져옵니다.
    const chatContainer = chatContainers[questionItemDataId];

    // 데이터베이스에서 질문 항목과 해당하는 채팅 컨테이너를 삭제하기 위한 AJAX 요청 데이터를 준비합니다.
    let dropJsonData = {
        'userId': userId,
        'roomIndex': roomIndex,
        'dataId': questionItemDataId
    };
    let dropJsonDataString = JSON.stringify(dropJsonData);

    try {
        // AJAX 요청이 성공하면 질문 항목과 채팅 컨테이너를 화면에서 제거합니다.
        const ajaxResult = await ajaxDropTable(dropJsonDataString);
        if (ajaxResult) {
            questionItem.remove();
            // 채팅 컨테이너를 제거합니다.
            if (chatContainer && mainContent.contains(chatContainer)) {
                mainContent.removeChild(chatContainer);
            }
            // 질문 목록을 확인하는 함수를 호출하여 화면을 업데이트합니다.
            checkQuestionsList();
        } else {
            console.log("테이블 삭제에 실패하였습니다.");
        }
    } catch (error) {
        console.error("AJAX 요청 중 오류 발생:", error);
    }
}

// 질문 목록을 확인하는 함수
// 질문 목록이 비어 있는 경우, 초기화면(소개 요소)을 다시 표시하는 함수입니다.
function checkQuestionsList() {
    const questionsList = document.getElementById('questionsList');
    if (questionsList.children.length === 0 && introElement) {
        introElement.style.display = 'block';
    }

    document
        .querySelectorAll('.chat-container')
        .forEach(container => {
            container.style.display = 'none';
        });
}

// 키 입력 핸들러 함수 (엔터 키 입력 시 메시지 전송)
// 사용자가 Enter 키를 눌렀을 때 메시지를 전송하는 함수입니다.
function handleKeyPress(event, id) {
    if (event.key === 'Enter') {
        event.preventDefault();
        console.log(id);
        sendMessage(id);
    }
}

// HTML 태그 내 특수 문자를 이스케이프하는 함수
// 사용자가 입력한 HTML을 안전하게 처리하기 위해 특수 문자를 변환하는 함수입니다.
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 팝업 메뉴를 토글하는 함수
// 질문 항목의 팝업 메뉴(··· 버튼)를 토글하는 함수입니다.
function togglePopupMenu(button) {
    // 클릭된 버튼의 부모 요소인 질문 항목을 가져옵니다.
    const questionItem = button.closest('.question-item');
    // 해당 질문 항목의 팝업 메뉴를 가져옵니다.
    const popupMenu = questionItem.querySelector('.popup-menu');
    const learning = questionItem.querySelector('.learning');
    const moving = questionItem.querySelector('.moving');

    // 모든 열려 있는 팝업 메뉴를 닫습니다.
    document
        .querySelectorAll('.popup-menu')
        .forEach(menu => {
            if (menu !== popupMenu) {
                menu.style.display = 'none';
            }
        });

    document
        .querySelectorAll('.learning')
        .forEach(menu => {
            if (menu !== learning) {
                menu.style.display = 'none';
            }
        });

    document
        .querySelectorAll('.moving')
        .forEach(menu => {
            if (menu !== moving) {
                menu.style.display = 'none';
            }
        });

    // 해당 팝업 메뉴의 표시 상태를 토글합니다.
    if (popupMenu) {
        popupMenu.style.display = popupMenu.style.display === 'block'
            ? 'none'
            : 'block';
    }

    if (learning) {
        learning.style.display = 'none';
    }

    if (moving) {
        moving.style.display = 'none';
    }
}

// 문서 클릭 이벤트로 팝업 메뉴와 학습 메뉴를 닫기
// 문서 전체에 클릭 이벤트를 등록하여 팝업 메뉴나 학습 메뉴를 닫는 함수입니다.
document.addEventListener('click', function (event) {
    const isClickInside = event
        .target
        .closest('.question-item');
    if (!isClickInside) {
        document
            .querySelectorAll('.popup-menu')
            .forEach(menu => menu.style.display = 'none');
        document
            .querySelectorAll('.learning')
            .forEach(menu => menu.style.display = 'none');
        document
            .querySelectorAll('.moving')
            .forEach(menu => menu.style.display = 'none');
    }
});

// 학습 메뉴를 토글하는 함수
// 질문 항목의 학습 메뉴를 표시하거나 숨기는 함수입니다.
async function toggleLearningMenu(button) {
    // 클릭된 버튼의 부모 요소인 질문 항목을 가져옵니다.
    const questionItem = button.closest('.question-item');
    // console.log(questionItem);
    const moving = questionItem.querySelector('.moving');
    if (moving) {
        questionItem
            .querySelector('.moving')
            .style
            .display = 'none';
    }

    // 질문 탭에 data-id 속성 값을 가져옵니다.
    const dataId = questionItem.getAttribute("data-id");
    // console.log("Data ID: " + dataId);

    // 학습 메뉴를 표시하기 위한 AJAX 요청 데이터를 준비합니다.
    let selectJsonData = {
        'userId': userId,
        'dataId': dataId
    };
    let selectJsonDataString = JSON.stringify(selectJsonData);

    try {
        // AJAX 요청을 통해 키워드 목록을 가져옵니다.
        const keywordArray = await ajaxSelectExcludedKeyword(selectJsonDataString);
        // console.log("Response Keyword Array:", keywordArray); // 응답 데이터 확인

        // 기존의 learning 요소를 찾습니다.
        let learning = questionItem.querySelector('.learning');

        // 키워드가 없으면 기존의 learning 요소를 제거하고 종료합니다.
        if (keywordArray.length === 0) {
            if (learning) {
                learning.remove();
            }
            return;
        }

        // 기존의 learning 요소가 없으면 생성합니다.
        if (!learning) {
            learning = document.createElement('div');
            learning.className = 'learning';
            questionItem.appendChild(learning);
        }

        // 기존의 learning 요소가 있으면 내용을 비웁니다.
        learning.innerHTML = '';

        // 제외 키워드 HTML을 생성합니다.
        let keywordContent = '';

        keywordArray.forEach(function (keyword) {
            keywordContent += '<button data-index=' + keyword.dataIndex + ' onclick="deleteExcludedKeyword(th' +
                    'is)">' + keyword.excludedKeyword + '</button>';
        });
        learning.innerHTML = keywordContent;

        // learning 메뉴를 토글합니다.
        learning.style.display = learning.style.display === 'block'
            ? 'none'
            : 'block';
    } catch (error) {
        console.error("Failed to load data:", error);
    }
}

// 제외 키워드 원상복구(테이블에서 삭제)
// 학습 메뉴에서 특정 키워드를 원상복구하는 함수입니다.
async function deleteExcludedKeyword(button) {
    // 클릭된 질문 항목의 data-id 속성 값을 가져옵니다.
    const dataId = button
        .closest('.question-item')
        .getAttribute('data-id');
    const learning = button.closest('.learning');
    const dataIndex = button.getAttribute('data-index');

    // 키워드를 원상복구하기 위한 AJAX 요청 데이터를 준비합니다.
    let deleteJeonData = {
        'userId': userId,
        'dataId': dataId,
        'dataIndex': dataIndex
    };
    let deleteJeonDataString = JSON.stringify(deleteJeonData);

    try {
        // AJAX 요청이 성공하면 해당 키워드를 삭제합니다.
        const ajaxResult = await ajaxDeleteExcludedKeyword(deleteJeonDataString);
        if (ajaxResult) {
            button.remove();
            if (learning.querySelector('button') === null) {
                learning.remove();
            }
        } else {
            console.log("키워드 삭제에 실패하였습니다.");
        }
    } catch (error) {
        console.error("AJAX 요청 중 오류 발생:", error);
    }
}

// 이동 버튼 클릭시 질문 아이템을 보여주는 함수
// 질문 항목의 이동 메뉴를 표시하거나 숨기는 함수입니다.
async function selectQuestionItem(button) {
    // 클릭된 질문 항목을 가져옵니다.
    const questionItem = button.closest('.question-item');
    const dataId = questionItem.getAttribute("data-id");
    const learning = questionItem.querySelector('.learning');
    if (learning) {
        questionItem
            .querySelector('.learning')
            .style
            .display = 'none';
    }

    // 학습 메뉴에서 이동할 질문 항목을 표시하기 위한 AJAX 요청 데이터를 준비합니다.
    let selectJsonData = {
        'userId': userId,
        'dataId': dataId
    };
    let selectJsonDataString = JSON.stringify(selectJsonData);

    try {
        // AJAX 요청을 통해 제외 키워드 목록을 가져옵니다.
        const keywordArray = await ajaxSelectExcludedKeyword(selectJsonDataString);
        // console.log("Response Keyword Array:", keywordArray); // 응답 데이터 확인

        // 키워드가 없으면 질문 목록 추가를 종료합니다.
        if (keywordArray.length != 0) {
            const questionsList = button.closest('.questions-list');
            const questionItems = questionsList.querySelectorAll('.question-item');
            const questionItemArr = Array.from(questionItems);
            let questionItemTitleArr = [];
            questionItemArr.forEach(function (item) {
                if (item.getAttribute('data-id') != questionItem.getAttribute('data-id')) 
                    questionItemTitleArr.push(item);
                }
            );
            // console.log("Question Item Title Arr: " + questionItemTitleArr);

            let moving = questionItem.querySelector('.moving');
            if (questionItemTitleArr.length === 0) {
                if (moving) {
                    moving.remove();
                }
                return;
            }
            if (!moving) {
                moving = document.createElement('div');
                moving.className = 'moving';
                questionItem.appendChild(moving);
            }
            moving.innerHTML = '';

            // 이동할 질문 항목의 HTML을 생성합니다.
            let questionItemTitle = '';

            questionItemTitleArr.forEach(function (item) {
                // console.log(item);
                questionItemTitle += '<button data-key=' + item.getAttribute('data-id') + ' onclick="moveExcludedKey' +
                        'word(this)">' + item
                    .querySelector('span')
                    .textContent
                    .trim() + '</button>';
            });
            moving.innerHTML = questionItemTitle;

            // moving 메뉴를 토글합니다.
            moving.style.display = moving.style.display === 'block'
                ? 'none'
                : 'block';
        }
    } catch (error) {
        console.error("Failed to load data:", error);
    }
}

// 제외된 키워드 다른 질문 테이블로 모두 이동하는 함수
// 학습 메뉴에서 특정 키워드를 다른 질문 항목으로 이동하는 함수입니다.
async function moveExcludedKeyword(button) {
    // 이동할 질문 항목의 data-id 속성 값을 가져옵니다.
    const dataKey = button.getAttribute('data-key');
    const questionItem = button.closest('.question-item');
    const dataId = questionItem.getAttribute('data-id');

    // 키워드를 다른 질문 항목으로 이동하기 위한 AJAX 요청 데이터를 준비합니다.
    let selectInsertJsonData = {
        'userId': userId,
        'dataId': dataId,
        'dataKey': dataKey
    };
    let selectInsertJsonDataString = JSON.stringify(selectInsertJsonData);

    try {
        // AJAX 요청이 성공하면 해당 키워드를 다른 질문 항목으로 이동합니다.
        const ajaxResult = await ajaxSelectInsertExcludedKeyword(
            selectInsertJsonDataString
        );
        if (ajaxResult) {
            button
                .closest('.moving')
                .style
                .display = 'none';
            button
                .closest('.moving')
                .previousElementSibling
                .style
                .display = 'none';
        } else {
            console.log("키워드 삭제에 실패하였습니다.");
        }
    } catch (error) {
        console.error("AJAX 요청 중 오류 발생:", error);
    }
}

// 질문 제목 수정 함수
// 사용자가 질문 항목의 제목을 변경할 때 호출되는 함수입니다.
function editQuestion(button) {
    // 클릭된 질문 항목을 가져옵니다.
    const questionItem = button.closest('.question-item');
    const dataId = questionItem.getAttribute('data-id');
    // console.log("Data ID: " + dataId);
    let questionHtml = questionItem.innerHTML;
    const learning = questionItem.querySelector('.learning');
    const moving = questionItem.querySelector('.moving');

    const popUpMenu = questionItem.querySelector('.popup-menu');
    popUpMenu.style.display = 'none';
    if (learning) {
        questionItem
            .querySelector('.learning')
            .style
            .display = 'none';
    }
    if (moving) {
        questionItem
            .querySelector('.moving')
            .style
            .display = 'none';
    }

    // 현재 질문 항목의 제목을 가져옵니다.
    let newName = questionItem.firstChild.textContent;

    setTimeout(async function () {
        // 사용자에게 새로운 제목을 입력받습니다.
        const userInput = prompt("새로운 이름을 입력하세요:", newName.trim());

        if (userInput !== null) { // 사용자가 취소를 누르면 prompt는 null을 반환합니다.
            newName = userInput;
            if (newName.trim()) { // 입력값이 비어 있지 않으면 텍스트를 변경합니다.
                questionItem.firstChild.textContent = newName;
                questionHtml = questionItem.innerHTML;
                // console.log("Question Item HTML: " + questionHtml);

                // 질문 제목을 데이터베이스에 업데이트하기 위한 AJAX 요청 데이터를 준비합니다.
                let updateJsonData = {
                    'userId': userId,
                    'dataId': dataId,
                    'questionHtml': questionHtml
                };
                let updateJsonDataString = JSON.stringify(updateJsonData);

                try {
                    // AJAX 요청을 통해 질문 제목을 업데이트합니다.
                    const ajaxResult = await ajaxUpdateQuestionTitle(updateJsonDataString);
                    if (ajaxResult) {
                        // console.log("제목 수정에 성공하였습니다.");
                    } else {
                        console.log("제목 수정에 실패하였습니다.");
                    }
                } catch (error) {
                    console.error("AJAX 요청 중 오류 발생:", error);
                }
            }
        }
        // 취소를 눌렀을 때는 아무것도 하지 않습니다.
    }, 100);
}

// 사이드바를 토글하는 함수
// 사이드바의 표시 상태를 토글(열기/닫기)하는 함수입니다.
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const openButton = document.getElementById('openSidebarButton');
    sidebar
        .classList
        .toggle('hidden');
    openButton.style.display = sidebar
        .classList
        .contains('hidden')
            ? 'flex'
            : 'none';
    openButton.style.left = '35px';
}

// 사이드바를 여는 함수
// 사이드바를 열고, 열기 버튼을 숨기는 함수입니다.
function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const openButton = document.getElementById('openSidebarButton');
    sidebar
        .classList
        .remove('hidden');
    openButton.style.display = 'none';
}

// AJAX 요청

// 전체 데이터 불러오기
// 데이터베이스에서 전체 데이터를 불러오는 AJAX 요청을 처리하는 함수입니다.
function ajaxLoadAllData(selectJsonDataString) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: "https://acelifetest.com/diary/selectAllData",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            dataType: 'json',
            data: selectJsonDataString,
            success: function (response) {
                if (response && response.header && response.header.resultCode === '00') {
                    console.log("Response Code: " + response.header.resultCode);
                    console.log("Response Message:", response.header.resultMessage);

                    let responseBody;
                    if (typeof response.body === 'string') {
                        responseBody = JSON.parse(response.body); // 문자열을 객체로 변환
                    } else {
                        responseBody = response.body;
                    }

                    if (responseBody && Array.isArray(responseBody.data)) {
                        // console.log("Data Array:", responseBody.data);
                        resolve(responseBody.data); // data 배열을 반환
                    } else {
                        console.log("No data array found in response body");
                        resolve([]); // data 배열이 없으면 빈 배열 반환
                    }
                } else {
                    console.log("Invalid response header or result code");
                    resolve([]); // 올바른 응답이 아니면 빈 배열 반환
                }
            },
            error: function (error) {
                console.error("Error:", error);
                reject(error); // 오류 시 프로미스 거부
            }
        });
    });
}

// AJAX 요청('talk_to_bot_all' 테이블의 질문 아이템 데이터 추가)
// 새로운 질문 항목을 데이터베이스에 추가하는 AJAX 요청을 처리하는 함수입니다.
function ajaxInsertQuestionItem(JsonData) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: "https://acelifetest.com/diary/insertTalkToBotAll",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            dataType: 'json',
            data: JsonData,
            success: function (response) {
                if (response.header.resultCode === '00') {
                    console.log("Response Code: " + response.header.resultCode);
                    console.log("Response Message:", response.header.resultMessage);
                    resolve(true); // 성공 시 프로미스 해결
                } else {
                    console.log("Result Code: " + response.header.resultCode);
                    console.log("Result Message:", response.header.resultMessage);
                    resolve(false); // 실패 시 프로미스 해결
                }
            },
            error: function (error) {
                console.error("Error:", error);
                reject(error); // 오류 시 프로미스 거부
            }
        });
    });
}

// AJAX 요청('chat_container' 테이블의 채팅방 데이터 추가)
// 채팅 컨테이너(질문 방)를 데이터베이스에 저장하는 함수입니다.
function ajaxUpdateChatContainer(JsonData) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: "https://acelifetest.com/diary/updateChatContainer",  // ✅ 수정된 URL
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            dataType: 'json',
            data: JsonData,
            success: function (response) {
                if (response.header.resultCode === '00') {
                    console.log("Response Code: " + response.header.resultCode);
                    console.log("Response Message:", response.header.resultMessage);
                    resolve(true);
                } else {
                    console.log("Result Code: " + response.header.resultCode);
                    console.log("Result Message:", response.header.resultMessage);
                    resolve(false);
                }
            },
            error: function (error) {
                console.error("Error:", error);
                reject(error);
            }
        });
    });
}

// AJAX 요청('talk_to_bot_data' 테이블의 사용자 질문 데이터 추가)
// 사용자가 입력한 질문을 데이터베이스에 추가하는 AJAX 요청을 처리하는 함수입니다.
function ajaxInsertUserQuestion(JsonData) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: "https://acelifetest.com/diary/insertTalkToBotData",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            dataType: 'json',
            data: JsonData,
            success: function (response) {
                if (response.header.resultCode === '00') {
                    console.log("Response Code: " + response.header.resultCode);
                    console.log("Response Message:", response.header.resultMessage);
                    // console.log("Response Body:", response.body);
                    resolve(true); // 성공 시 프로미스 해결
                } else {
                    console.log("Result Code: " + response.header.resultCode);
                    console.log("Result Message:", response.header.resultMessage);
                    // console.log("Result Body:", response.body);
                    resolve(false); // 실패 시 프로미스 해결
                }
            },
            error: function (error) {
                console.error("Error:", error);
                reject(error); // 오류 시 프로미스 거부
            }
        });
    });
}

// AJAX 요청('talk_to_bot_data' 테이블의 봇 응답 데이터 추가)
// 봇의 응답 메시지를 데이터베이스에 추가하는 AJAX 요청을 처리하는 함수입니다.
function ajaxInsertBotAnswer(JsonData) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: "https://acelifetest.com/diary/insertTalkToBotData",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            dataType: 'json',
            data: JsonData,
            success: function (response) {
                if (response.header.resultCode === '00') {
                    console.log("Response Code: " + response.header.resultCode);
                    console.log("Response Message:", response.header.resultMessage);
                    // console.log("Response Body:", response.body);
                    resolve(true); // 성공 시 프로미스 해결
                } else {
                    console.log("Result Code: " + response.header.resultCode);
                    console.log("Result Message:", response.header.resultMessage);
                    // console.log("Response Body:", response.body);
                    resolve(false); // 실패 시 프로미스 해결
                }
            },
            error: function (error) {
                console.error("Error:", error);
                reject(error); // 오류 시 프로미스 거부
            }
        });
    });
}

// AJAX 요청(데이터 전처리)
// 사용자의 질문을 전처리하여 키워드 추출 등의 작업을 수행하는 AJAX 요청을 처리하는 함수입니다.
function ajaxPreProcessingData(JsonData) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: "https://acelifetest.com/diary/PreProcessingData",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            dataType: 'json',
            data: JsonData,
            success: function (response) {
                if (response.header.resultCode === '00') {
                    console.log("Response Code: " + response.header.resultCode);
                    console.log("Response Message:", response.header.resultMessage);
                    // console.log("Response Body:", response.body);
                    resolve(response); // 성공 시 프로미스 해결
                } else {
                    console.log("Result Code: " + response.header.resultCode);
                    console.log("Result Message:", response.header.resultMessage);
                    // console.log("Result Body:", response.body);
                    resolve(false); // 실패 시 프로미스 해결
                }
            },
            error: function (error) {
                console.error("Error:", error);
                reject(error); // 오류 시 프로미스 거부
            }
        });
    });
}

// AJAX 요청('talk_to_bot_all' 및 'talk_to_bot_data' 테이블 삭제)
// 특정 질문 항목과 해당하는 채팅 컨테이너를 데이터베이스에서 삭제하는 AJAX 요청을 처리하는 함수입니다.
function ajaxDropTable(JsonData) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: "https://acelifetest.com/diary/dropTable",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            dataType: 'json',
            data: JsonData,
            success: function (response) {
                if (response.header.resultCode === '00') {
                    console.log("Response Code: " + response.header.resultCode);
                    console.log("Response Message:", response.header.resultMessage);
                    // console.log("Response Body:", response.body);
                    resolve(true); // 성공 시 프로미스 해결
                } else {
                    console.log("Result Code: " + response.header.resultCode);
                    console.log("Result Message:", response.header.resultMessage);
                    // console.log("Response Body:", response.body);
                    resolve(false); // 실패 시 프로미스 해결
                }
            },
            error: function (error) {
                console.error("Error:", error);
                reject(error); // 오류 시 프로미스 거부
            }
        });
    });
}

// AJAX 요청('excluded_keywords' 테이블에 데이터 추가)
// 사용자가 특정 키워드를 삭제한 경우, 해당 키워드를 제외 키워드 테이블에 추가하는 AJAX 요청을 처리하는 함수입니다.
function ajaxInsertExcludedKeyword(JsonData) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: "https://acelifetest.com/diary/insertExcludedKeyword",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            dataType: 'json',
            data: JsonData,
            success: function (response) {
                if (response.header.resultCode === '00') {
                    console.log("Response Code: " + response.header.resultCode);
                    console.log("Response Message:", response.header.resultMessage);
                    // console.log("Response Body:", response.body);
                    resolve(true); // 성공 시 프로미스 해결
                } else {
                    console.log("Result Code: " + response.header.resultCode);
                    console.log("Result Message:", response.header.resultMessage);
                    // console.log("Response Body:", response.body);
                    resolve(false); // 실패 시 프로미스 해결
                }
            },
            error: function (error) {
                console.error("Error:", error);
                reject(error); // 오류 시 프로미스 거부
            }
        });
    });
}

// AJAX 요청('excluded_keywords' 테이블에서 데이터 조회)
// 특정 질문 항목에 대해 제외된 키워드를 조회하는 AJAX 요청을 처리하는 함수입니다.
function ajaxSelectExcludedKeyword(JsonData) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: "https://acelifetest.com/diary/selectExcludedKeyword",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            dataType: 'json',
            data: JsonData,
            success: function (response) {
                // console.log("AJAX Response:", response); // 응답 데이터 확인

                if (response && response.header && response.header.resultCode === '00') {
                    console.log("Response Code: " + response.header.resultCode);
                    console.log("Response Message:", response.header.resultMessage);

                    let responseBody;
                    if (typeof response.body === 'string') {
                        responseBody = JSON.parse(response.body); // 문자열을 객체로 변환
                    } else {
                        responseBody = response.body;
                    }

                    if (responseBody && Array.isArray(responseBody.data.keywordArray)) {
                        // console.log("Keyword Array:", responseBody.data.keywordArray);
                        resolve(responseBody.data.keywordArray); // 키워드 배열을 반환
                    } else {
                        console.log("No keywordArray array found in response Body");
                        resolve([]); // 키워드 배열이 없으면 빈 배열 반환
                    }
                } else {
                    console.log("Invalid response header or result code");
                    resolve([]); // 올바른 응답이 아니면 빈 배열 반환
                }
            },
            error: function (error) {
                console.error("Error:", error);
                reject(error); // 오류 시 프로미스 거부
            }
        });
    });
}

// AJAX 요청('talk_to_bot_data' 테이블의 봇 응답 데이터 업데이트)
// 봇의 응답 메시지를 데이터베이스에서 업데이트하는 AJAX 요청을 처리하는 함수입니다.
function ajaxUpdateBotAnswer(JsonData) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: "https://acelifetest.com/diary/updateTalkToBotData",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            dataType: 'json',
            data: JsonData,
            success: function (response) {
                if (response.header.resultCode === '00') {
                    console.log("Response Code: " + response.header.resultCode);
                    console.log("Response Message:", response.header.resultMessage);
                    // console.log("Response Body:", response.body);
                    resolve(true); // 성공 시 프로미스 해결
                } else {
                    console.log("Result Code: " + response.header.resultCode);
                    console.log("Result Message:", response.header.resultMessage);
                    // console.log("Response Body:", response.body);
                    resolve(false); // 실패 시 프로미스 해결
                }
            },
            error: function (error) {
                console.error("Error:", error);
                reject(error); // 오류 시 프로미스 거부
            }
        });
    });
}

// AJAX 요청('excluded_keywords' 테이블에서 데이터 삭제)
// 사용자가 특정 키워드를 복구(제외에서 삭제)할 때 데이터베이스에서 해당 데이터를 삭제하는 AJAX 요청을 처리하는 함수입니다.
function ajaxDeleteExcludedKeyword(JsonData) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: "https://acelifetest.com/diary/deleteExcludedKeyword",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            dataType: 'json',
            data: JsonData,
            success: function (response) {
                if (response.header.resultCode === '00') {
                    console.log("Response Code: " + response.header.resultCode);
                    console.log("Response Message:", response.header.resultMessage);
                    // console.log("Response Body:", response.body);
                    resolve(true); // 성공 시 프로미스 해결
                } else {
                    console.log("Result Code: " + response.header.resultCode);
                    console.log("Result Message:", response.header.resultMessage);
                    // console.log("Response Body:", response.body);
                    resolve(false); // 실패 시 프로미스 해결
                }
            },
            error: function (error) {
                console.error("Error:", error);
                reject(error); // 오류 시 프로미스 거부
            }
        });
    });
}

// AJAX 요청('excluded_keywords' 테이블의 데이터 이동)
// 제외된 키워드를 다른 질문 항목으로 이동하는 AJAX 요청을 처리하는 함수입니다.
function ajaxSelectInsertExcludedKeyword(JsonData) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: "https://acelifetest.com/diary/selectInsertExcludedKeyword",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            dataType: 'json',
            data: JsonData,
            success: function (response) {
                if (response.header.resultCode === '00') {
                    console.log("Response Code: " + response.header.resultCode);
                    console.log("Response Message:", response.header.resultMessage);
                    // console.log("Response Body:", response.body);
                    resolve(true); // 성공 시 프로미스 해결
                } else {
                    console.log("Result Code: " + response.header.resultCode);
                    console.log("Result Message:", response.header.resultMessage);
                    // console.log("Response Body:", response.body);
                    resolve(false); // 실패 시 프로미스 해결
                }
            },
            error: function (error) {
                console.error("Error:", error);
                reject(error); // 오류 시 프로미스 거부
            }
        });
    });
}

// AJAX 요청('talk_to_bot_all' 테이블의 질문 제목 업데이트)
// 사용자가 질문 제목을 변경할 때 데이터베이스에서 해당 제목을 업데이트하는 AJAX 요청을 처리하는 함수입니다.
function ajaxUpdateQuestionTitle(JsonData) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: "https://acelifetest.com/diary/updateQuestionTitle",
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            dataType: 'json',
            data: JsonData,
            success: function (response) {
                if (response.header.resultCode === '00') {
                    console.log("Response Code: " + response.header.resultCode);
                    console.log("Response Message:", response.header.resultMessage);
                    // console.log("Response Body:", response.body);
                    resolve(true); // 성공 시 프로미스 해결
                } else {
                    console.log("Result Code: " + response.header.resultCode);
                    console.log("Result Message:", response.header.resultMessage);
                    // console.log("Response Body:", response.body);
                    resolve(false); // 실패 시 프로미스 해결
                }
            },
            error: function (error) {
                console.error("Error:", error);
                reject(error); // 오류 시 프로미스 거부
            }
        });
    });
}
