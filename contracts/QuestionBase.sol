pragma solidity ^0.4.24;

contract QuestionBase {
	struct Question {
		string description;
		string[4] option;
		uint[4] approvalsOfOption;
		string[] comments;
	}

	Question[] private questions;

	function postQuestion(string des, string op1, string op2, string op3, string op4) public returns (uint) {
		uint[4] memory approvals;
		for (uint i = 0; i < 4; i++) {
			approvals[i] = 0;
		}
		string[4] memory op = [op1, op2, op3, op4];
		Question memory q = Question({
			description: des,
			option: op,
			approvalsOfOption: approvals,
			comments: new string[](0)
		});
		questions.push(q);
		return questions.length - 1;
	}

	function giveApprovalToOption(uint id, uint index) public {
		require(id >= 0 && id < questions.length);
		require(index >= 0 && index <= 3);
		questions[id].approvalsOfOption[index]++;
	}

	function postComment(uint id, string comment) public returns (uint) {
		require(id >= 0 && id < questions.length);
		questions[id].comments.push(comment);
		return questions[id].comments.length - 1;
	}

	function getQuestionsCount() public view returns (uint) {
		return questions.length;
	}

	function getCommentsCountOf(uint id) public view returns (uint) {
		require(id >= 0 && id < questions.length);
		return questions[id].comments.length;
	}

	function getQuestionOf(uint id) public view returns (string, string, string, string, string, uint[]) {
		require(id >= 0 && id < questions.length);
		Question memory q = questions[id];
		return (getDescriptionOf(id), q.option[0], q.option[1], q.option[2], q.option[3], getApprovalsOf(id));
	}

	function getCommentOf(uint id, uint index) public view returns (string) {
		require(id >= 0 && id < questions.length);
		Question memory q = questions[id];
		require(index >= 0 && index < q.comments.length);
		return q.comments[index];
	}

	function getDescriptionOf(uint id) public view returns (string) {
		require(id >= 0 && id < questions.length);
		return questions[id].description;
	}

	function getOptionOf(uint id, uint index) public view returns (string) {
		require(id >= 0 && id < questions.length);
		require(index >= 0 && index <= 3);
		return questions[id].option[index];
	}

	function getApprovalsOf(uint id) public view returns (uint[]) {
		require(id >= 0 && id < questions.length);
		uint[] memory approvals = new uint[](4);
		for (uint i = 0; i < 4; i++) {
			approvals[i] = questions[id].approvalsOfOption[i];
		}
		return approvals;
	}
}
