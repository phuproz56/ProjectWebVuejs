module.exports = {
	init: function (app, express) {
		const router = express.Router();

		router.get("/groups", async function (request, result) {
			// get all groups
			const groups = await db.collection("groups").find({}).toArray();

			const usersUpdated = [];

			// get all members
			for (let a = 0; a < groups.length; a++) {
				for (let b = 0; b < groups[a].members.length; b++) {
					// check if each user has groups array
					const userMember = await db.collection("users").findOne({
						$and: [{
							_id: groups[a].members[b].user._id
						}, {
							"groups._id": {
								$ne: groups[a]._id
							}
						}]
					});

					// if not, then push
					if (userMember != null) {
						usersUpdated.push(userMember);
						
						await db.collection("users").findOneAndUpdate({
							_id: groups[a].members[b].user._id
						}, {
							$push: {
								groups: {
									_id: groups[a]._id,
									unreadMessages: 0
								}
							}
						});
					}
				}

				// do the same for admin too
				const userMember = await db.collection("users").findOne({
					$and: [{
						_id: groups[a].createdBy._id
					}, {
						"groups._id": {
							$ne: groups[a]._id
						}
					}]
				});

				// if not, then push
				if (userMember != null) {
					usersUpdated.push(userMember);
					
					await db.collection("users").findOneAndUpdate({
						_id: groups[a].createdBy._id
					}, {
						$push: {
							groups: {
								_id: groups[a]._id,
								unreadMessages: 0
							}
						}
					});
				}
			}

			result.json(JSON.stringify(usersUpdated));
		});

		app.use("/seeder", router);
	}
};