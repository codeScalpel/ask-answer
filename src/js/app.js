const contractAddress = "0xc994341a0666fe716534547c7b4d9c0f19dfe741"; //合约地址(以太坊Rinkeby测试网络)

App = {
    web3Provider: null,
    contracts: {},
    contractInstance: null,
    isEditNewQuestion: false,
    isWaitingToRecover: false,
    canCommentsBeDisplayed: false,
    questionsCount: 0,
    curQuestionId: -1,
    curCommentIndex: -1,
    curCommentsCount: -1,
    optionsCountOfCurQuestion: -1,
    curSelectedOptionIndex: -1,
    approvalsOfOption: new Array(4),
    infoOfQuestionToBePosted: new Array(5),

    init: async function() {
        return await App.initWeb3();
    },

    initWeb3: async function() {
        //实例化web3对象，如果有Mist或Metamask就默认由它们提供，否则使用本地的Provider
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
        } else { 
            //提醒用户下载MetaMask或Mist
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:9545');
        }
        web3 = new Web3(App.web3Provider);
        return App.initContract();
    },

    initContract: function() {
        $.getJSON('QuestionBase.json', function(data) {
            var questionBaseArtifact = data;
            App.contracts.QuestionBase = TruffleContract(questionBaseArtifact);
            App.contracts.QuestionBase.setProvider(App.web3Provider);
            return App.initInstance();
        });
        return App.bindEvents();
    },

    initInstance: function() {
        App.contracts.QuestionBase.at(contractAddress).then(function(instance) {
            App.contractInstance = instance;
            App.showRandomQuestion();
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    // 由于上传了测试数据，所以不考虑合约上问题为0的情况
    showRandomQuestion: function() {
        App.reset();
        App.hideElementsWhenShowQuestion();
        App.contractInstance.getQuestionsCount.call().then(function(count) {
            App.questionsCount = count.c[0];
            App.updateQuestionCount();
            if (count.c[0] > 0) {
                App.curQuestionId = App.generateRandomNumLessThan(count.c[0], App.curQuestionId);
                App.showCurQuestion();
                App.updateCommentsCount();
                App.showCurComment();
            }
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    reset: function() {
        App.isEditNewQuestion = false;
        App.isWaitingToRecover = false;
        App.canCommentsBeDisplayed = false;
        App.curCommentIndex = -1;
        App.curCommentsCount = -1;
        App.optionsCountOfCurQuestion = -1;
        App.curSelectedOptionIndex = -1;
        $('.OptionContent').removeClass("OptionClicked");
        $('#PostQuestionButton').css('display', 'block');
    },

    hideElementsWhenShowQuestion: function() {
        $('.Approvals, .Percentage, #ErrorMessage, #ShowRandomCommentButton').css('display', 'none');
    },

    updateQuestionCount: function() {
        $('#Description-title').text("共 " + App.questionsCount + " 道问题");
    },

    // 必定可以生成与上一个数不同的新的数
    // 特殊情况：before是-1，num是2的话，一定生成0
    // 所以在共2道题目和只有2条评论时，一定显示第1道题目和第1条评论
    generateRandomNumLessThan: function(num, before) {
        if (num < 1) return -1;
        if (num == 1) return 0;
        var now = Math.floor(Math.random() * (num - 1)) + 1;
        return (before + now) % num;
    },

    showCurQuestion: function() {
        App.contractInstance.getQuestionOf(App.curQuestionId).then(result => {
            App.showDesciption(result[0]);
            App.optionsCountOfCurQuestion = App.nonemptyOptionsCount([result[1], result[2], result[3], result[4]]);
            if (App.optionsCountOfCurQuestion == 0) {
                App.hideOptionsAndPostButton();
                App.showFirstRandomCommentOfCurQuestion();
                App.canCommentsBeDisplayed = true;
            } else {
                App.showOptions(result[1], result[2], result[3], result[4]);
            }
            App.recordApprovals(result[5]);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    nonemptyOptionsCount: function(options) {
        var count = 0;
        for (var i = 0; i < options.length; i++) {
            if (options[i] != "") {
                count++;
            }
        }
        return count;
    },

    hideOptionsAndPostButton: function() {
        $('.Option, #PostQuestionButton').css('display', 'none');
    },

    showFirstRandomCommentOfCurQuestion: function() {
        $('#ShowRandomCommentButton').css('display', 'block');
        setTimeout(App.showRandomComment, 500);
    },

    showRandomComment: async function() {
        await App.updateCommentsCount();
        if (App.canCommentsBeDisplayed) {
            if (App.curCommentsCount <= 0) {
                App.warnOfNoComments();
            } else {
                App.generateRandomCommentIndex();
                App.showCurComment();
            }
        }
    },

    updateCommentsCount: function() {
        App.contractInstance.getCommentsCountOf(App.curQuestionId).then(function(result) {
            App.curCommentsCount = result.c[0];
            $('#CommentCount').text(App.curCommentsCount + " 条评论");
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    warnOfNoComments: function() {
        $('#CommentContent-inner').text("还没有人来评论呢");
    },

    generateRandomCommentIndex: function() {
        App.curCommentIndex = App.generateRandomNumLessThan(App.curCommentsCount, App.curCommentIndex);
    },

    showCurComment: function() {
        if (App.curCommentIndex < 0) {
            // 当前评论索引是-1只有两种情况：换题后还没进行选项选择，当前问题下还没有评论
            if (!App.canCommentsBeDisplayed) { 
                App.warnOfNoChoiceSelected();
            } else {
                App.warnOfNoComments();
            }
        } else {
            App.contractInstance.getCommentOf(App.curQuestionId, App.curCommentIndex).then(function(comment) {
                $('#CommentContent-inner').text(comment);
            }).catch(function(err) {
                console.log(err.message);
            });
        }
    },

    warnOfNoChoiceSelected: function() {
        $('#CommentContent-inner').text("单击选项进行选择，然后才会显示评论哦。上传按钮可以将你的选择写入到区块链");
    },

    showDesciption: function(des) {
        $('#Description').text(des);
    },

    showOptions: function(op1, op2, op3, op4) {
        App.showOption(op1, "#Option1");
        App.showOption(op2, "#Option2");
        App.showOption(op3, "#Option3");
        App.showOption(op4, "#Option4");
    },

    showOption: function(op, id) {
        if (op != "") {
            $(id).css('display', 'block');
            $(id + "-content").text(op);
        } else {
            $(id).css('display', 'none');
        }
    },

    recordApprovals: function(approvals) {
        App.approvalsOfOption[0] = approvals[0].c[0];
        App.approvalsOfOption[1] = approvals[1].c[0];
        App.approvalsOfOption[2] = approvals[2].c[0];
        App.approvalsOfOption[3] = approvals[3].c[0];
    },

    bindEvents: function() {
        $(document).on('click', '.OptionContent', App.handleClickOption);
        $(document).on('click', '#PostCommentButton', App.handleClickPostCommentButton);
        $(document).on('click', '#EditNewQuestionButton', App.handleClickEditNewQuestionButton);
        $(document).on('click', '#SkipButton', App.handleClickSkipButton);
        $(document).on('click', '#PostQuestionButton', App.handleClickPostQuestionButton);
        $(document).on('click', '#ShowRandomCommentButton', App.handleClickShowRandomCommentButton);
    },

    // 点击问题选项
    handleClickOption: function(event) {
        if (App.isWaitingToRecover)
            return;
        if (!App.isEditNewQuestion) {
            App.modifyElementsWhenClickOption(event.target);
            App.recordCurSelectedOptionIndex(event.target);
            if (!App.canCommentsBeDisplayed) {
                App.showFirstRandomCommentOfCurQuestion();
                setTimeout(App.showApprovalsCountOfEachOption, 500);
                setTimeout(App.showApprovalRateOfEachOption, 500);
                App.canCommentsBeDisplayed = true;
            }
        }
    },

    modifyElementsWhenClickOption: function(target) {
        $('.OptionContent').removeClass("OptionClicked");
        $(target).addClass("OptionClicked");
        $('#ErrorMessage').css('display', 'none');
    },

    recordCurSelectedOptionIndex: function(target) {
        var id = $(target).attr('id');
        App.curSelectedOptionIndex = id[6] - '1';
    },

    showApprovalsCountOfEachOption: function() {
        var id = ["#Approvals1", "#Approvals2", "#Approvals3", "#Approvals4"];
        for (var i = 0; i < App.optionsCountOfCurQuestion; i++) {
            $(id[i]).text("赞同 " + App.approvalsOfOption[i]);
        }
        $('.Approvals').css('display', 'block');
    },

    showApprovalRateOfEachOption: function() {
        var rate = App.approvalRateOfEachOption();
        var id = ["#Percentage1", "#Percentage2", "#Percentage3", "#Percentage4"];
        for (var i = 0; i < App.optionsCountOfCurQuestion; i++) {
            $(id[i]).css('width', rate[i]);
        }
        $('.Percentage').css('display', 'block');
    },

    approvalRateOfEachOption: function() {
        var sum = App.sumOfOptionsApprovals();
        var percentage = [];
        for (var i = 0; i < App.optionsCountOfCurQuestion; i++) {
            if (sum == 0) {
                percentage[i] = "0%";
            } else {
                percentage[i] = Math.round(App.approvalsOfOption[i] * 100 / sum).toString() + "%";
            }
        }
        return percentage;
    },

    sumOfOptionsApprovals: function() {
        var sum = 0;
        for (var i = 0; i < App.optionsCountOfCurQuestion; i++) {
            sum += App.approvalsOfOption[i];
        }
        return sum;
    },

    // 点击评论按钮
    handleClickPostCommentButton: function() {
        if (App.isWaitingToRecover)
            return;
        if (App.isEditNewQuestion) {
            App.clearTextTypedIn();
            App.warnThatClickedWhenEditNewQuestion();
        } else if (App.isNothingTypedIn()) {
            App.warnOfNothingTypedIn();
        } else {
            App.postComment();
        }
    },

    clearTextTypedIn: function() {
        $('#CommentWritingArea-content').val("");
    },

    warnThatClickedWhenEditNewQuestion: function() {
        $('#CommentWritingArea-content').attr('placeholder', "当前不能评论哦");
    },

    warnOfNothingTypedIn: function() {
        $('#CommentWritingArea-content').attr('placeholder', "评论内容为空哦");
    },

    isNothingTypedIn: function() {
        return $('#CommentWritingArea-content').val() === "";
    },

    postComment: function() {
        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }
            var account = accounts[0];
            App.contractInstance.postComment(App.curQuestionId, $('#CommentWritingArea-content').val(), {from: account}).then(function(result) {
                App.clearTextTypedIn();
                App.notifyCommentPosted();
                App.isWaitingToRecover = true;
                setTimeout(App.recoverFromCommentPostedWaiting, 3000);
            }).catch(function(err) {
                console.log(err.message);
            });
        });
    },

    notifyCommentPosted: function() {
        $('#CommentContent-inner').text("评论已上传，写入区块链时间不等(10s~5min)，请耐心等待。3s后将继续你的问答旅程哦");
    },

    recoverFromCommentPostedWaiting: function() {
        App.isWaitingToRecover = false;
        App.showRandomComment();
        if (!App.canCommentsBeDisplayed) {
            // 判断条件说明问题是有选项的，那么只可能是没有进行选择
            App.warnOfNoChoiceSelected();
        }
    },

    // 点击提问按钮
    handleClickEditNewQuestionButton: function() {
        if (App.isWaitingToRecover)
            return;
        App.modifyElementsWhenEditNewQuestion();
        App.modifyTextWhenEditNewQuestion();
        App.isEditNewQuestion = true;
    },

    modifyElementsWhenEditNewQuestion: function() {
        App.hideElementsWhenShowQuestion();
        $('#Description, .Option').css('display', 'block');
        $('#Description, .OptionContent').attr("contentEditable", true);
        $('#Description').addClass("BorderBottom");
        $('.OptionContent').removeClass("OptionClicked");
        $('#PostQuestionButton').css('display', 'block');
    },

    modifyTextWhenEditNewQuestion: function() {
        $('#Description-title').text("问题");
        $('#CommentCount').text("你知道吗");
        $('#CommentContent-inner').text("问题最多只能有四个选项，空选项在上传时会跳过哦。第一行是问题描述，其余四行分别对应四个选项");
        $('#Description, .OptionContent').text("");
        App.postAndCancelButtonText();
    },

    postAndCancelButtonText: function() {
        $('#PostQuestionButton').text("发布");
        $('#SkipButton').text("取消");
    },

    // 点击换题/取消按钮
    handleClickSkipButton: function() {
        if (App.isWaitingToRecover)
            return;
        if (App.isEditNewQuestion) {
            App.resumeElementWhenFinshEditingQuestion();
            App.okAndPassButtonText();
            App.updateQuestionCount();
            App.isEditNewQuestion = false;
            App.showCurQuestion();
            App.updateCommentsCount();
            App.showCurComment();
        } else {
            App.showRandomQuestion();
        }
    },

    resumeElementWhenFinshEditingQuestion: function() {
        $('#Description, .OptionContent').attr("contentEditable", false);
        $('#Description').removeClass("BorderBottom");
        $('#ErrorMessage').css('display', 'none');
        if (App.curSelectedOptionIndex != -1) {
            $('#Option' + (App.curSelectedOptionIndex + 1).toString() + "-content").addClass("OptionClicked");
            $('.Approvals, .Percentage, #ShowRandomCommentButton').css('display', 'block');
        }
    },

    okAndPassButtonText: function() {
        $('#PostQuestionButton').text("上传");
        $('#SkipButton').text("换题");
    },

    // 点击上传/发布按钮
    handleClickPostQuestionButton: function() {
        if (App.isWaitingToRecover)
            return;
        if (App.isEditNewQuestion) {
            if (App.isQuestionDescriptionEmpty()) {
                App.warnOfNoQuestionDescription();
            } else {
                App.generateQuestionInfo();
                App.postQuestion();
            }
        } else {
            if (App.curSelectedOptionIndex == -1) {
                App.warnThatNoOptionSelected();
            } else {
                App.giveApprovalToSelectedOption();
            }
        }
    },

    isQuestionDescriptionEmpty: function() {
        return $('#Description').text() === "";
    },

    warnOfNoQuestionDescription: function() {
        $('#ErrorMessage').css('display', 'block').text("问题描述不能为空哦");
    },

    generateQuestionInfo: function() {
        App.infoOfQuestionToBePosted[0] = $('#Description').text();
        App.generateOptionInfo();
    },

    generateOptionInfo: function() {
        var i = 1;
        if ($('#Option1-content').text() != "")
            App.infoOfQuestionToBePosted[i++] = $('#Option1-content').text();
        if ($('#Option2-content').text() != "")
            App.infoOfQuestionToBePosted[i++] = $('#Option2-content').text();
        if ($('#Option3-content').text() != "")
            App.infoOfQuestionToBePosted[i++] = $('#Option3-content').text();
        if ($('#Option4-content').text() != "")
            App.infoOfQuestionToBePosted[i++] = $('#Option4-content').text();
        for (; i <= 4; i++)
            App.infoOfQuestionToBePosted[i] = "";
    },

    postQuestion: function() {
        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }
            var account = accounts[0];
            App.contractInstance.postQuestion(App.infoOfQuestionToBePosted[0],
                                                App.infoOfQuestionToBePosted[1],
                                                App.infoOfQuestionToBePosted[2],
                                                App.infoOfQuestionToBePosted[3],
                                                App.infoOfQuestionToBePosted[4],
                                                {from: account}).then(function(result) {
                App.resumeElementWhenFinshEditingQuestion();
                App.notifyQuestionPosted();
                App.okAndPassButtonText();
                App.isWaitingToRecover = true;
                App.isEditNewQuestion = false;
                setTimeout(App.recoverFromQuestionPostedWaiting, 3000);
            }).catch(function(err) {
                console.log(err.message);
            });
        });
    },

    recoverFromQuestionPostedWaiting: function() {
        App.isWaitingToRecover = false;
        App.showRandomQuestion();
    },

    notifyQuestionPosted: function() {
        $('#CommentCount').text("");
        $('#CommentContent-inner').text("问题已上传，写入区块链时间不等(10s~5min)，请耐心等待。3s后将继续你的问答旅程哦");
    },

    warnThatNoOptionSelected: function() {
        $('#ErrorMessage').css('display', 'block').text("你还没有选择哦");
    },

    giveApprovalToSelectedOption:function() {
        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }
            var account = accounts[0];
            App.contractInstance.giveApprovalToOption(App.curQuestionId, App.curSelectedOptionIndex, {from: account}).then(function(result) {
                App.updateApprovalsCountAndApprovalRate();
            }).catch(function(err) {
                console.log(err.message);
            });
        });
    },

    updateApprovalsCountAndApprovalRate: function() {
        var index = App.curSelectedOptionIndex;
        var approvals = ++App.approvalsOfOption[index];
        $('#Approvals' + (index + 1).toString()).text("赞同 " + approvals);
        App.showApprovalRateOfEachOption();
    },

    // 点击下一条按钮
    handleClickShowRandomCommentButton: function() {
        App.showRandomComment();
    }

};

$(function() {
    $(window).load(function() {
        App.init();
    });
});
