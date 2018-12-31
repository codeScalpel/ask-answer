pragma solidity ^0.4.2;
import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/QuestionBase.sol";

contract TestQuestionBase {
	QuestionBase qb = QuestionBase(DeployedAddresses.QuestionBase());

	function testgetQuestionsCount() public {
		qb.postQuestion("How are you?",
			"I'm fine.", "Thank you.", "And you?", "How old are you?");
		uint num = qb.getQuestionsCount();
		uint expected = 1;
		Assert.equal(num, expected, "Questions num should be 1.");
	}

	function testgetDescription() public {
		uint id = qb.postQuestion("How are you?",
			"I'm fine.", "Thank you.", "And you?", "How old are you?");
		string memory des = qb.getDescriptionOf(id);
		string memory expected = "How are you?";
		Assert.equal(des, expected, "");
	}

	function testGetOptions() public {
		uint id = qb.postQuestion("How are you?",
			"I'm fine.", "Thank you.", "And you?", "How old are you?");
		Assert.equal(qb.getOptionOf(id, 0), "I'm fine.", "");
		Assert.equal(qb.getOptionOf(id, 1), "Thank you.", "");
		Assert.equal(qb.getOptionOf(id, 2), "And you?", "");
		Assert.equal(qb.getOptionOf(id, 3), "How old are you?", "");
	}

	function testGetApprovals() public {
		uint id = qb.postQuestion("How are you?",
			"I'm fine.", "Thank you.", "And you?", "How old are you?");
		for (uint i = 0; i < 4; i++) {
			Assert.equal(qb.getApprovalsOf(id)[i], 0, "");
			qb.giveApprovalToOption(id, i);
			Assert.equal(qb.getApprovalsOf(id)[i], 1, "");
		}
	}

	function testPostComment() public {
		uint id = qb.postQuestion("How are you?",
			"I'm fine.", "Thank you.", "And you?", "How old are you?");
		Assert.equal(qb.getCommentsCountOf(id), 0, "");
		qb.postComment(id, "I learned so much from it.");
		Assert.equal(qb.getCommentsCountOf(id), 1, "");
		qb.postComment(id, "Perfect!");
		Assert.equal(qb.getCommentsCountOf(id), 2, "");
		Assert.equal(qb.getCommentOf(id, 0), "I learned so much from it.", "");
		Assert.equal(qb.getCommentOf(id, 1), "Perfect!", "");
	}

	function testGetQuestion() public {
		uint id = qb.postQuestion("How are you?",
			"I'm fine.", "Thank you.", "And you?", "How old are you?");
		string memory des;
		string memory op1;
		string memory op2;
		string memory op3;
		string memory op4;
		uint[] memory approvals;
		(des, op1, op2, op3, op4, approvals) = qb.getQuestionOf(id);
		Assert.equal(des, "How are you?", "");
		Assert.equal(op1, "I'm fine.", "");
		Assert.equal(op2, "Thank you.", "");
		Assert.equal(op3, "And you?", "");
		Assert.equal(op4, "How old are you?", "");
		for (uint i = 0; i < 4; i++) {
			Assert.equal(approvals[i], 0, "");
		}
	}
}
